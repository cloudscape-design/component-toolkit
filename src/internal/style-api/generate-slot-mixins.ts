// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StyleApiDocs, StyleApiTokenSlotDocs } from './docs.js';

export interface GenerateSlotMixinsOptions {
  /** The component name, as used in the module path and in error messages (e.g. "badge"). */
  component: string;
  /** The component's Style API docs, as returned by extractStyleApiDocs. */
  docs: StyleApiDocs;
}

// The mixin arguments an allowlisted shorthand expands to. Allowlists name the shorthand, never one of its arguments.
// The order is general to specific, because the runtime emits declarations in this order and a later one wins.
const PROPERTY_ARGUMENTS: Record<string, string[]> = {
  padding: ['padding', 'padding-block', 'padding-inline'],
  border: [
    'border-color',
    'border-width',
    'border-style',
    'border-block-color',
    'border-block-width',
    'border-block-style',
    'border-inline-color',
    'border-inline-width',
    'border-inline-style',
  ],
  'border-radius': [
    'border-radius',
    'border-start-start-radius',
    'border-start-end-radius',
    'border-end-start-radius',
    'border-end-end-radius',
  ],
};

const RUNTIME_MODULE = '@cloudscape-design/component-toolkit/internal/style-api/slot-mixins';

/**
 * Generates a Sass module with one mixin per slot of a component. A mixin takes one keyword argument per token and
 * CSS property of the slot, named after it, e.g. `@include badge.root($color: red, $padding-inline: 12px)`. Slots
 * without tokens or properties, including forwarding slots, get no mixin: a forwarding slot is styled with the
 * mixin of the slot it forwards to.
 */
export function generateSlotMixins({ component, docs }: GenerateSlotMixinsOptions): string {
  const mixins = docs.slots
    .filter((slot): slot is StyleApiTokenSlotDocs => 'tokens' in slot)
    .filter(slot => slot.tokens.length > 0 || slot.properties.length > 0)
    .map(slot => generateMixin(component, slot));

  const header = [`// GENERATED from the ${component} Style API docs — do not edit.`];
  if (mixins.length > 0) {
    header.push(`@use '${RUNTIME_MODULE}' as slot-mixins;`);
  }
  return [header.join('\n'), ...mixins].join('\n\n') + '\n';
}

function generateMixin(component: string, slot: StyleApiTokenSlotDocs): string {
  for (const property of slot.properties) {
    const shorthand = Object.keys(PROPERTY_ARGUMENTS).find(key => PROPERTY_ARGUMENTS[key].includes(property));
    if (shorthand && shorthand !== property) {
      throw new Error(`Slot "${component}.${slot.name}" allowlists "${property}". Allow "${shorthand}" instead.`);
    }
  }
  const properties = slot.properties.flatMap(property => PROPERTY_ARGUMENTS[property] ?? [property]);
  const clash = slot.tokens.find(name => properties.includes(name));
  if (clash) {
    throw new Error(`Slot "${component}.${slot.name}" declares "${clash}" as both a token and a property.`);
  }
  const parameters = [...slot.tokens, ...properties].map(name => `  $${name}: null`);
  const argumentMap = (names: string[]) => names.map(name => `      '${name}': $${name},`);

  const call = [`    '${component}.${slot.name}',`];
  if (slot.tokens.length > 0) {
    call.push('    $tokens: (', ...argumentMap(slot.tokens), '    ),');
  }
  if (properties.length > 0) {
    call.push('    $properties: (', ...argumentMap(properties), '    ),');
  }

  return [
    `@mixin ${slot.name}(`,
    parameters.join(',\n'),
    `) {`,
    `  @include slot-mixins.apply(`,
    ...call,
    `  );`,
    `}`,
  ].join('\n');
}
