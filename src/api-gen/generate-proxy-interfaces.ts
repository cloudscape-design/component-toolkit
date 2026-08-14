// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';

import {
  applyPatch,
  IndentationText,
  normalizeDtsSurface,
  parsePatch,
  Project,
  resolveUpstreamDts,
  stripAwsuiSystemCore,
} from './internal.js';

export interface GenerateProxyInterfacesOptions {
  /** Directory to resolve the upstream package from. Defaults to `process.cwd()`. */
  cwd?: string;
}

/**
 * Apply a hand-authored `interfaces.diff.ts` patch on top of the upstream
 * component interface (read from the installed package `.d.ts` named by the
 * diff's `declare module`) and return the generated proxy interface source.
 */
export async function generateProxyInterfaces(
  diffSource: string,
  options: GenerateProxyInterfacesOptions = {}
): Promise<string> {
  const cwd = options.cwd ?? process.cwd();

  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: { indentationText: IndentationText.TwoSpaces },
  });
  const diffSf = project.createSourceFile('interfaces.diff.ts', diffSource);
  const patch = parsePatch(diffSf);

  const upstreamText = await readFile(resolveUpstreamDts(patch.moduleSpecifier, cwd), 'utf-8');
  const outSf = project.createSourceFile('interfaces.gen.ts', upstreamText, { overwrite: true });

  normalizeDtsSurface(outSf);
  applyPatch(outSf, patch);
  outSf.formatText({ indentSize: 2, convertTabsToSpaces: true });

  return stripAwsuiSystemCore(outSf.getFullText());
}
