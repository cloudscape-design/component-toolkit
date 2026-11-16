// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StyleApiDocs, StyleApiTokenSlotDocs } from './docs.js';

export interface GenerateSlotMixinsOptions {
  /** The component name, as used in the module path and in error messages (e.g. "badge"). */
  component: string;
  /** The component's Style API docs, as returned by extractStyleApiDocs. */
  docs: StyleApiDocs;
}

const RUNTIME_MODULE = '@cloudscape-design/component-toolkit/internal/style-api/slot-mixins';

/**
 * Generates a Sass module with one mixin per slot of a component. A mixin takes one keyword argument per token and
 * CSS property of the slot, named after it; token arguments carry the `awsui-` prefix so they can't be mistaken for
 * CSS properties, e.g. `@include slider.handle($awsui-fill-color: red, $color: blue)`. Slots
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
  const properties = slot.properties;
  const tokenParameter = (token: string) => `awsui-${token}`;
  const parameters = [...slot.tokens.map(tokenParameter), ...properties].map(name => `  $${name}: null`);
  const argumentMap = (names: string[], parameter = (name: string) => name) =>
    names.map(name => `      '${name}': $${parameter(name)},`);

  const call = [`    '${component}.${slot.name}',`];
  if (slot.tokens.length > 0) {
    call.push('    $tokens: (', ...argumentMap(slot.tokens, tokenParameter), '    ),');
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
