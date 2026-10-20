// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import path from 'path';
import { compileString } from 'sass';

export function readStyleApiSource(file: string) {
  return fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
}

// Compiles `scss`, serving each module source under its `@use` URL: Sass's own file resolution doesn't work in
// jest's sandbox.
export function compileWithModules(modules: Record<string, string>, scss: string) {
  const importer = {
    canonicalize: (url: string) => (url in modules ? new URL(`module:${encodeURIComponent(url)}`) : null),
    load: (url: URL) => ({ contents: modules[decodeURIComponent(url.pathname)], syntax: 'scss' as const }),
  };
  return compileString(scss, { importers: [importer] }).css;
}
