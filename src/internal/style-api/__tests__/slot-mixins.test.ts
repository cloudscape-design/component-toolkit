// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * @jest-environment node
 */
import { StyleApiDocs } from '../docs';
import { generateSlotMixins } from '../generate-slot-mixins';
import { compileWithModules, readStyleApiSource } from './sass-utils';

const tokenSlot = (name: string, tokens: string[], properties: string[] = []) => ({
  name,
  tokens,
  tokenDescriptions: {},
  properties,
  propertyDescriptions: {},
});

const docs: Record<string, StyleApiDocs> = {
  badge: {
    slots: [
      tokenSlot('root', [], ['color', 'background', 'border', 'border-radius', 'padding', 'font-family']),
      tokenSlot('hook', []),
      { name: 'dismissButton', forwardsTo: { component: 'button', slot: 'root' } },
    ],
  },
  slider: { slots: [tokenSlot('handle', ['border-radius'], ['color'])] },
};

const modules = Object.fromEntries(
  Object.entries(docs).map(([component, componentDocs]) => [
    component,
    generateSlotMixins({ component, docs: componentDocs }),
  ])
);

function compile(scss: string) {
  const uses = Object.keys(modules).map(name => `@use '${name}';`);
  return compileWithModules(
    {
      ...modules,
      '@cloudscape-design/component-toolkit/internal/style-api/slot-mixins': readStyleApiSource('slot-mixins.scss'),
    },
    [...uses, scss].join('\n')
  );
}

test('generates a module per component', () => {
  expect(modules).toMatchSnapshot();
});

test('generated mixins compile to CSS', () => {
  expect(
    compile(`
      .empty {
        @include badge.root;
      }
      .badge {
        @include badge.root(
          $padding-inline: 4px,
          $padding: 12px 0 0 2px,
          $border-start-start-radius: 12px,
          $border-radius: 4px 4px 0 0,
          $border-inline-color: red blue,
          $background: (linear-gradient(red, blue), #fff),
          $font-family: ("Open Sans", sans-serif)
        );
        &:hover {
          @include badge.root($color: red);
        }
      }
      .handle {
        @include slider.handle($color: red, $border-radius: 4px);
      }
    `)
  ).toMatchSnapshot();
});

test.each([
  ['an unknown argument', `.x { @include badge.root($letter-spacing: 1px); }`, 'No parameter named $letter-spacing'],
  ['use outside of a rule', `@include badge.root($color: red);`, 'badge.root must be included inside a rule'],
])('fails the build for %s', (_, scss, error) => {
  expect(() => compile(scss)).toThrow(error);
});

test('fails generation when a slot allowlists a specific argument instead of its shorthand', () => {
  expect(() =>
    generateSlotMixins({ component: 'x', docs: { slots: [tokenSlot('root', [], ['padding-inline'])] } })
  ).toThrow('Slot "x.root" allowlists "padding-inline". Allow "padding" instead.');
});

test('fails generation when a token and a property argument share a name', () => {
  expect(() =>
    generateSlotMixins({ component: 'x', docs: { slots: [tokenSlot('root', ['border-color'], ['border'])] } })
  ).toThrow('declares "border-color" as both a token and a property');
});
