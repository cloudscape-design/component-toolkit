// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import path from 'node:path';

import {
  IndentationText,
  InterfaceDeclaration,
  ModuleDeclaration,
  ModuleDeclarationKind,
  Project,
  SourceFile,
  TypeAliasDeclaration,
} from 'ts-morph';

const LICENSE_HEADER = /^\/\/ Copyright Amazon\.com[^\n]*\r?\n\/\/ SPDX-License-Identifier:[^\n]*\r?\n+/;

/** Remove the leading Cloudscape license header, if present. */
export function stripLicenseHeader(source: string): string {
  return source.replace(LICENSE_HEADER, '');
}

/**
 * Remove `@awsuiSystem core` annotations: whole comment blocks that contain only
 * the tag are dropped; the tag line is removed from comments that also carry
 * real documentation (the surrounding api-doc is kept).
 */
export function stripAwsuiSystemCore(text: string): string {
  const soleTagBlock = /^[ \t]*\/\*\*[\s*]*?@awsuiSystem[ \t]+core[\s*]*?\*\/[ \t]*\r?\n?/gm;
  const tagLineInBlock = /^[ \t]*\*[ \t]*@awsuiSystem[ \t]+core[ \t]*\r?\n/gm;
  return text.replace(soleTagBlock, '').replace(tagLineInBlock, '');
}

interface Documentable {
  getJsDocs(): Array<{ getText(): string }>;
}

function jsDocText(node: Documentable): string {
  return node
    .getJsDocs()
    .map(d => d.getText())
    .join('\n');
}

/** Walk up from `fromDir` to find an installed package directory. */
function resolvePackageDir(packageName: string, fromDir: string): string {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', packageName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`Cannot resolve package "${packageName}" from ${fromDir}`);
    }
    dir = parent;
  }
}

/** Locate a package's shared `types` directory. */
export function resolveTypesDir(packageName: string, fromDir: string): string {
  return path.join(resolvePackageDir(packageName, fromDir), 'types');
}

/** Resolve a module specifier (e.g. `@scope/pkg/button`) to its interfaces `.d.ts`. */
export function resolveUpstreamDts(moduleSpecifier: string, fromDir: string): string {
  const segments = moduleSpecifier.split('/');
  const isScoped = moduleSpecifier.startsWith('@');
  const packageName = isScoped ? segments.slice(0, 2).join('/') : segments[0];
  const subpath = segments.slice(isScoped ? 2 : 1);
  const dir = path.join(resolvePackageDir(packageName, fromDir), ...subpath);
  for (const candidate of ['interfaces.d.ts', 'index.d.ts']) {
    const candidatePath = path.join(dir, candidate);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }
  throw new Error(`Cannot find interfaces.d.ts or index.d.ts for "${moduleSpecifier}" (looked in ${dir})`);
}

interface OverrideDecl {
  name: string;
  decl: string;
  jsDoc: string;
}

interface Patch {
  moduleSpecifier: string;
  publicInterfaceName?: string;
  removedProps: Set<string>;
  propOverrides: OverrideDecl[];
  removedNsMembers: Set<string>;
  nsOverrides: OverrideDecl[];
}

/** Parse a hand-authored `interfaces.diff.ts` source file into a structured patch. */
export function parsePatch(diffSf: SourceFile): Patch {
  const mod = diffSf.getModules().find(m => m.getDeclarationKind() === ModuleDeclarationKind.Module);
  if (!mod) {
    throw new Error('The diff must contain a `declare module "..."` augmentation.');
  }

  const namespaces = mod.getModules().filter(m => m.getDeclarationKind() === ModuleDeclarationKind.Namespace);
  const namespaceNames = new Set(namespaces.map(n => n.getName()));
  const interfaces = mod.getInterfaces();
  // The public interface shares its name with a declared namespace, else the first one.
  const publicInterface = interfaces.find(i => namespaceNames.has(i.getName())) ?? interfaces[0];

  const patch: Patch = {
    moduleSpecifier: mod.getName().replace(/^["']|["']$/g, ''),
    publicInterfaceName: publicInterface?.getName(),
    removedProps: new Set(),
    propOverrides: [],
    removedNsMembers: new Set(),
    nsOverrides: [],
  };

  for (const iface of interfaces) {
    for (const prop of iface.getProperties()) {
      if (prop.getTypeNode()?.getText() === 'never') {
        patch.removedProps.add(prop.getName());
      } else {
        patch.propOverrides.push({ name: prop.getName(), decl: prop.getText(), jsDoc: jsDocText(prop) });
      }
    }
  }

  for (const ns of namespaces) {
    const members = [
      ...ns.getTypeAliases().map(node => ({ node, isTypeAlias: true })),
      ...ns.getInterfaces().map(node => ({ node, isTypeAlias: false })),
    ].sort((a, b) => a.node.getPos() - b.node.getPos());

    for (const { node, isTypeAlias } of members) {
      const name = node.getName();
      if (isTypeAlias && (node as TypeAliasDeclaration).getTypeNode()?.getText() === 'never') {
        patch.removedNsMembers.add(name);
      } else {
        patch.nsOverrides.push({ name, decl: node.getText(), jsDoc: jsDocText(node) });
      }
    }
  }

  return patch;
}

/** Convert a copied `.d.ts` surface into a real, exported `.ts` surface. */
export function normalizeDtsSurface(outSf: SourceFile): void {
  for (const ns of outSf.getModules()) {
    if (ns.getDeclarationKind() === ModuleDeclarationKind.Namespace) {
      exportNamespaceMembers(ns);
    }
  }
}

/**
 * In an ambient namespace members are implicitly exported; a real namespace
 * needs explicit `export` to keep them accessible as `X.Member`. Recurses into
 * nested namespaces (e.g. an interface + same-named namespace, as in `BoxProps`).
 */
function exportNamespaceMembers(ns: ModuleDeclaration): void {
  ns.setHasDeclareKeyword(false);
  for (const member of [...ns.getTypeAliases(), ...ns.getInterfaces(), ...ns.getFunctions(), ...ns.getEnums()]) {
    member.setIsExported(true);
  }
  for (const nested of ns.getModules()) {
    nested.setIsExported(true);
    exportNamespaceMembers(nested);
  }
}

/** Apply a parsed patch to the copied upstream source (mutates `outSf`). */
export function applyPatch(outSf: SourceFile, patch: Patch): void {
  // Removals: drop `: never` props wherever declared, and `= never` namespace
  // members (including a same-named nested namespace merged onto the member).
  for (const iface of outSf.getInterfaces()) {
    for (const name of patch.removedProps) {
      iface.getProperty(name)?.remove();
    }
  }
  for (const ns of outSf.getModules()) {
    for (const name of patch.removedNsMembers) {
      ns.getTypeAlias(name)?.remove();
      ns.getInterface(name)?.remove();
      ns.getModule(name)?.remove();
    }
  }

  // Overrides + additions are appended to the end (diff order); the diff's JSDoc
  // wins, otherwise the upstream member's JSDoc is preserved.
  const target = patch.publicInterfaceName ? outSf.getInterface(patch.publicInterfaceName) : undefined;
  if (target) {
    for (const override of patch.propOverrides) {
      const existing = target.getProperty(override.name);
      const jsDoc = override.jsDoc || (existing ? jsDocText(existing) : '');
      existing?.remove();
      target.addMember(jsDoc ? `${jsDoc}\n${override.decl}` : override.decl);
    }
  }

  if (patch.nsOverrides.length > 0 && patch.publicInterfaceName) {
    const targetNs = findOrCreateNamespace(outSf, patch.publicInterfaceName);
    for (const override of patch.nsOverrides) {
      const existing: TypeAliasDeclaration | InterfaceDeclaration | undefined =
        targetNs.getTypeAlias(override.name) ?? targetNs.getInterface(override.name);
      const jsDoc = override.jsDoc || (existing ? jsDocText(existing) : '');
      targetNs.getTypeAlias(override.name)?.remove();
      targetNs.getInterface(override.name)?.remove();
      targetNs.addStatements(jsDoc ? `${jsDoc}\n${override.decl}` : override.decl);
    }
  }
}

/** Find the public namespace, creating an exported empty one if none exists. */
function findOrCreateNamespace(outSf: SourceFile, name: string): ModuleDeclaration {
  const existing = outSf
    .getModules()
    .find(m => m.getDeclarationKind() === ModuleDeclarationKind.Namespace && m.getName() === name);
  return existing ?? outSf.addModule({ name, isExported: true, declarationKind: ModuleDeclarationKind.Namespace });
}

export { IndentationText, Project };
