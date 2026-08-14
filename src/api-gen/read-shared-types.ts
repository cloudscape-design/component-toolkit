// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import path from 'node:path';

import { resolveTypesDir, stripLicenseHeader } from './internal.js';

export interface SharedType {
  /** File name relative to the target `types` directory, as a `.ts` file. */
  path: string;
  /** File contents with the license header removed. */
  source: string;
}

export interface ReadSharedTypesOptions {
  /** Directory to resolve the package from. Defaults to `process.cwd()`. */
  cwd?: string;
}

/**
 * Read a package's shared public types (its `types/*.d.ts` files), returning
 * each as a `.ts` file with the license header removed so a proxy project can
 * write them into its own `types` directory.
 */
export async function readSharedTypes(
  packageName: string,
  options: ReadSharedTypesOptions = {}
): Promise<SharedType[]> {
  const typesDir = resolveTypesDir(packageName, options.cwd ?? process.cwd());
  const entries = await fs.promises.readdir(typesDir, { withFileTypes: true });

  const result: SharedType[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.d.ts')) {
      continue;
    }
    const source = await fs.promises.readFile(path.join(typesDir, entry.name), 'utf-8');
    result.push({ path: entry.name.replace(/\.d\.ts$/, '.ts'), source: stripLicenseHeader(source) });
  }
  return result;
}
