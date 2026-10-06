// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { extractStyleApiDocs, StyleApiTokenSlotDocs } from '../docs';

// Emulates the compiled output of `@include style-api.docs($name, $tokens, $properties)`.
const marker = (name: string, tokens: string[], properties: string[] = []) =>
  `/* awsui:style-api-slot name=${name} tokens=${tokens.join(', ')} properties=${properties.join(', ')} */`;

// Emulates the compiled output of `@include style-api.docs-forward($name, $component, $slot)`.
const forwardMarker = (name: string, component: string, slot: string) =>
  `/* awsui:style-api-slot name=${name} component=${component} slot=${slot} */`;

// The expected docs of a token slot, with the always-present fields defaulted to empty.
const tokenSlot = (
  slot: Pick<StyleApiTokenSlotDocs, 'name'> & Partial<StyleApiTokenSlotDocs>
): StyleApiTokenSlotDocs => ({
  tokens: [],
  tokenDescriptions: {},
  properties: [],
  propertyDescriptions: {},
  ...slot,
});

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
  expect(extractStyleApiDocs(css).slots).toEqual([
    tokenSlot({ name: 'label', tokens: ['color-text', 'color-background'] }),
  ]);
});

test('reads multiple slots having the same token name', () => {
  const css = `
    ${marker('input', ['color-text', 'color-background'])}
    ${marker('dropdown', ['color-text', 'color-background'])}
  `;
  const docs = extractStyleApiDocs(css);
  expect(docs.slots).toEqual([
    tokenSlot({ name: 'input', tokens: ['color-text', 'color-background'] }),
    tokenSlot({ name: 'dropdown', tokens: ['color-text', 'color-background'] }),
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
  expect(extractStyleApiDocs(css).slots).toEqual([tokenSlot({ name: 'empty' })]);
});

test('tolerates whitespaces inside the marker', () => {
  const css = `/* \nawsui:style-api-slot name=header tokens=color-text,   color-border  properties=  */`;
  expect(extractStyleApiDocs(css).slots).toEqual([
    tokenSlot({ name: 'header', tokens: ['color-text', 'color-border'] }),
  ]);
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
    tokenSlot({ name: 'root', tokens: ['color-text', 'color-background'] }),
    { name: 'dismissButton', forwardsTo: { component: 'button', slot: 'button' } },
  ]);
});

test('throws on a malformed marker instead of silently ignoring it', () => {
  const css = `/* awsui:style-api-slot name=column layout tokens=color-text properties= */`;
  expect(() => extractStyleApiDocs(css)).toThrow(/malformed style-api docs annotation/);
  expect(() => extractStyleApiDocs(`/* awsui:style-api-slot name=root tokens=color-text */`)).toThrow(
    /malformed style-api docs annotation/
  );
});

test('throws on a duplicate slot name across token and forward markers', () => {
  const css = `
    ${marker('dismissButton', ['color-text'])}
    ${forwardMarker('dismissButton', 'button', 'button')}
  `;
  expect(() => extractStyleApiDocs(css)).toThrow(/multiple .+ annotations with the same name: "dismissButton"/);
});

// Emulates the description markers emitted by `docs()`.
const description = (slot: string, kind: 'slot' | 'token' | 'property', name: string, text: string) =>
  `/* awsui:style-api-description slot=${slot} kind=${kind} name=${name} text=${text} */`;

test('attaches token descriptions to their slot', () => {
  const css = `
    ${marker('root', ['color', 'background-color'])}
    ${description('root', 'token', 'color', 'Text color, also used for the icon')}
  `;
  expect(extractStyleApiDocs(css).slots).toEqual([
    tokenSlot({
      name: 'root',
      tokens: ['color', 'background-color'],
      tokenDescriptions: { color: 'Text color, also used for the icon' },
    }),
  ]);
});

test('reads allowlisted properties and their descriptions', () => {
  const css = `
    ${marker('root', ['color'], ['padding-inline', 'font-weight'])}
    ${description('root', 'property', 'padding-inline', 'Horizontal padding')}
  `;
  expect(extractStyleApiDocs(css).slots).toEqual([
    tokenSlot({
      name: 'root',
      tokens: ['color'],
      properties: ['padding-inline', 'font-weight'],
      propertyDescriptions: { 'padding-inline': 'Horizontal padding' },
    }),
  ]);
});

test('reads allowlisted properties on a slot without tokens', () => {
  expect(extractStyleApiDocs(marker('root', [], ['padding-block'])).slots).toEqual([
    tokenSlot({ name: 'root', properties: ['padding-block'] }),
  ]);
});

test('throws when a description refers to an undeclared or forwarding slot', () => {
  expect(() => extractStyleApiDocs(description('root', 'token', 'color', 'Text'))).toThrow('undeclared');
  const css = `${forwardMarker('dismissButton', 'button', 'root')} ${description('dismissButton', 'slot', 'dismissButton', 'Text')}`;
  expect(() => extractStyleApiDocs(css)).toThrow('forwarding');
});

test('throws when a description refers to an undeclared token or property', () => {
  const css = `${marker('root', ['color'])} ${description('root', 'token', 'border-color', 'Border')}`;
  expect(() => extractStyleApiDocs(css)).toThrow('undeclared token "border-color"');
  const css2 = `${marker('root', ['color'])} ${description('root', 'property', 'padding-block', 'Padding')}`;
  expect(() => extractStyleApiDocs(css2)).toThrow('undeclared property "padding-block"');
});

test('throws on a malformed description marker', () => {
  expect(() => extractStyleApiDocs('/* awsui:style-api-description slot=root kind=token */')).toThrow('malformed');
});

test('attaches a slot description to its slot', () => {
  const css = `${marker('root', [])} ${description('root', 'slot', 'root', 'Class hook for state selectors')}`;
  expect(extractStyleApiDocs(css).slots).toEqual([
    tokenSlot({ name: 'root', description: 'Class hook for state selectors' }),
  ]);
});
