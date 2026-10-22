// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @jest-environment node
 */
import { extractStyleApiDocs } from '../docs';
import { compileWithModules, readStyleApiSource } from './sass-utils';

const modules = { 'style-api': readStyleApiSource('index.scss') };

function compile(scss: string) {
  return compileWithModules(modules, `@use 'style-api';\n${scss}`);
}

test('docs produces markers that the extractor reads back', () => {
  const css = compile(`
    $root: style-api.resolve((color, background-color), public);
    @include style-api.docs(
      'root',
      $root,
      $properties: (padding, font-weight),
      $descriptions: (
        tokens: (color: 'Text color, also used for the icon'),
        properties: (padding: 'Inner spacing'),
      )
    );
    @include style-api.docs('hook', $properties: font-size, $descriptions: (slot: 'Class hook for state selectors'));
    @include style-api.docs('plain', $root);
  `);
  expect(extractStyleApiDocs(css).slots).toEqual([
    {
      name: 'root',
      tokens: ['color', 'background-color'],
      tokenDescriptions: { color: 'Text color, also used for the icon' },
      properties: ['padding', 'padding-block', 'padding-inline', 'font-weight'],
      propertyDescriptions: { padding: 'Inner spacing' },
    },
    {
      name: 'hook',
      tokens: [],
      tokenDescriptions: {},
      properties: ['font-size'],
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
