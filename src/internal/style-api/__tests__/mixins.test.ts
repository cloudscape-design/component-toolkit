// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { compileString } from 'sass';

import { extractStyleApiDocs } from '../docs';

const styleApiSource = fs.readFileSync(path.resolve(__dirname, '../index.scss'), 'utf8');

// Serves the style-api module through an importer: Sass's own file resolution doesn't work in jest's sandbox.
const importer = {
  canonicalize: (url: string) => (url === 'style-api' ? new URL('style-api:index') : null),
  load: () => ({ contents: styleApiSource, syntax: 'scss' as const }),
};

function compile(scss: string) {
  return compileString(`@use 'style-api';\n${scss}`, { importers: [importer] }).css;
}

test('docs produces markers that the extractor reads back', () => {
  const css = compile(`
    $root: style-api.resolve((color, background-color), public);
    @include style-api.docs(
      'root',
      $root,
      $properties: (padding-inline, font-weight),
      $descriptions: (
        tokens: (color: 'Text color, also used for the icon'),
        properties: (padding-inline: 'Horizontal padding'),
      )
    );
    @include style-api.docs('hook', $properties: padding-block, $descriptions: (slot: 'Class hook for state selectors'));
    @include style-api.docs('plain', $root);
  `);
  expect(extractStyleApiDocs(css).slots).toEqual([
    {
      name: 'root',
      tokens: ['color', 'background-color'],
      tokenDescriptions: { color: 'Text color, also used for the icon' },
      properties: ['padding-inline', 'font-weight'],
      propertyDescriptions: { 'padding-inline': 'Horizontal padding' },
    },
    {
      name: 'hook',
      tokens: [],
      tokenDescriptions: {},
      properties: ['padding-block'],
      propertyDescriptions: {},
      description: 'Class hook for state selectors',
    },
    {
      name: 'plain',
      tokens: ['color', 'background-color'],
      tokenDescriptions: {},
      properties: [],
      propertyDescriptions: {},
    },
  ]);
});

test('docs fails the build when a description contains a comment terminator', () => {
  expect(() => compile(`@include style-api.docs('root', $descriptions: (slot: 'a */ b'));`)).toThrow(
    'must not contain "*/"'
  );
  expect(() =>
    compile(`@include style-api.docs('root', $properties: (color), $descriptions: (properties: (color: 'a */ b')));`)
  ).toThrow('must not contain "*/"');
});
