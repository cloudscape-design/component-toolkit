// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { extractStyleApiDocs } from '../docs';

// Emulates the compiled output of `@include style-api.docs($name, $map)`.
const marker = (name: string, tokens: string[]) =>
  `/* awsui:style-api-slot name=${name} tokens=${tokens.join(', ')} */`;

// Emulates the compiled output of `@include style-api.docs-forward($name, $component, $slot)`.
const forwardMarker = (name: string, component: string, slot: string) =>
  `/* awsui:style-api-slot name=${name} component=${component} slot=${slot} */`;

test('returns no slots when there are no markers', () => {
  const css = `
    .root { padding-inline: var(--awsui-style-padding-inline, 8px); }
  `;
  expect(extractStyleApiDocs(css)).toEqual({ slots: [] });
});

test('reads a slot and its tokens from a marker', () => {
  const css = `
    ${marker('label', ['color-text', 'color-background'])}
    .root { padding-inline: var(--awsui-style-padding-inline, 8px); }
  `;
  expect(extractStyleApiDocs(css).slots).toEqual([{ name: 'label', tokens: ['color-text', 'color-background'] }]);
});

test('reads multiple slots having the same token name', () => {
  const css = `
    ${marker('input', ['color-text', 'color-background'])}
    ${marker('dropdown', ['color-text', 'color-background'])}
  `;
  const docs = extractStyleApiDocs(css);
  expect(docs.slots).toEqual([
    { name: 'input', tokens: ['color-text', 'color-background'] },
    { name: 'dropdown', tokens: ['color-text', 'color-background'] },
  ]);
});

test('throws on a duplicate slot name (each slot must be annotated exactly once)', () => {
  const css = `
    ${marker('input', ['color-text', 'color-background'])}
    ${marker('input', ['padding-inline', 'padding-block'])}
  `;
  expect(() => extractStyleApiDocs(css)).toThrow(/multiple .+ annotations with the same name: "input"/);
});

test('tolerates empty slots', () => {
  const css = `
    ${marker('empty', [])}
  `;
  expect(extractStyleApiDocs(css).slots).toEqual([{ name: 'empty', tokens: [] }]);
});

test('tolerates whitespaces inside the marker', () => {
  const css = `/* \nawsui:style-api-slot name=header tokens=color-text,   color-border  */`;
  expect(extractStyleApiDocs(css).slots).toEqual([{ name: 'header', tokens: ['color-text', 'color-border'] }]);
});

test('reads a forward slot that points to another component slot', () => {
  const css = `
    ${forwardMarker('dismissButton', 'button', 'button')}
    .root { padding-inline: var(--awsui-style-padding-inline, 8px); }
  `;
  expect(extractStyleApiDocs(css).slots).toEqual([
    { name: 'dismissButton', forwardsTo: { component: 'button', slot: 'button' } },
  ]);
});

test('reads token slots and forward slots together, preserving order', () => {
  const css = `
    ${marker('root', ['color-text', 'color-background'])}
    ${forwardMarker('dismissButton', 'button', 'button')}
  `;
  expect(extractStyleApiDocs(css).slots).toEqual([
    { name: 'root', tokens: ['color-text', 'color-background'] },
    { name: 'dismissButton', forwardsTo: { component: 'button', slot: 'button' } },
  ]);
});

test('throws on a malformed marker instead of silently ignoring it', () => {
  const css = `/* awsui:style-api-slot name=column layout tokens=color-text */`;
  expect(() => extractStyleApiDocs(css)).toThrow(/malformed style-api docs annotation/);
});

test('throws on a duplicate slot name across token and forward markers', () => {
  const css = `
    ${marker('dismissButton', ['color-text'])}
    ${forwardMarker('dismissButton', 'button', 'button')}
  `;
  expect(() => extractStyleApiDocs(css)).toThrow(/multiple .+ annotations with the same name: "dismissButton"/);
});
