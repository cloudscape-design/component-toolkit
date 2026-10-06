// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { compileString } from 'sass';

const stylingSource = fs.readFileSync(path.resolve(__dirname, '../index.scss'), 'utf8');

// Serves the module through an importer: Sass's own file resolution doesn't work in jest's sandbox.
const importer = {
  canonicalize: (url: string) => (url === 'styling' ? new URL('styling:index') : null),
  load: () => ({ contents: stylingSource, syntax: 'scss' as const }),
};

function compile(scss: string) {
  return compileString(`@use 'styling' as cloudscape;\n${scss}`, { importers: [importer] }).css;
}

test('styling.override adds two id-level parts to the consumer selector', () => {
  const css = compile(`
    .my-badge { @include cloudscape.override { font-weight: 700; } }
    .my-badge:hover { @include cloudscape.override { color: red; } }
  `);
  expect(css).toContain('.my-badge:not(#\\9 ):not(#\\9 ) {\n  font-weight: 700;\n}');
  expect(css).toContain('.my-badge:hover:not(#\\9 ):not(#\\9 ) {\n  color: red;\n}');
});
