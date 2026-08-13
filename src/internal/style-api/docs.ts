// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Extracts the Style API documentation surface from a component's *compiled* CSS.
//
// Slots are declared explicitly by the author with the style-api docs mixins, which emit a
// machine-readable marker comment into the compiled CSS. Two forms exist:
//
//   token slot   — `@include style-api.docs($name, $tokens)`:
//     /* awsui:style-api-slot name=<slot> tokens=<t1>, <t2> */
//
//   forward slot — `@include style-api.docs-forward($name, $component, $slot)`:
//     /* awsui:style-api-slot name=<slot> component=<component> slot=<target-slot> */
//
// A forward slot reuses another component's slot (e.g. a nested Button) instead of owning tokens;
// the docs consumer resolves it to that component's slot, so it never goes stale. This module parses
// both forms.

const MARKER = /awsui:style-api-slot\s+name=([\w-]+)\s+(?:tokens=([^*]*)|component=([\w-]+)\s+slot=([\w-]+)\s*)\*\//g;

export interface StyleApiDocs {
  /**
   * The component's themeable slots (defined by classNames). Each slot either owns a set of style
   * tokens or forwards to another component's slot.
   */
  slots: StyleApiSlotDocs[];
}

export type StyleApiSlotDocs = StyleApiTokenSlotDocs | StyleApiForwardSlotDocs;

interface StyleApiSlotDocsBase {
  /**
   * The first argument of the docs mixin - must match the corresponding classNames slot.
   */
  name: string;
}

export interface StyleApiTokenSlotDocs extends StyleApiSlotDocsBase {
  /**
   * The public style tokens this slot supports (without "--awsui-style" prefix).
   */
  tokens: string[];
}

export interface StyleApiForwardSlotDocs extends StyleApiSlotDocsBase {
  /**
   * The slot this one forwards to. Its tokens are whatever the referenced component's slot documents.
   */
  forwardsTo: { component: string; slot: string };
}

/**
 * Extracts the Style API slot documentation from a component's compiled CSS by reading the explicit
 * slot markers emitted by the style-api docs mixins.
 */
export function extractStyleApiDocs(css: string): StyleApiDocs {
  const slots = new Array<StyleApiSlotDocs>();
  const usedSlots = new Set<string>();

  for (const match of css.matchAll(MARKER)) {
    const [, name, tokens, component, slot] = match;
    if (usedSlots.has(name)) {
      throw new Error(`Found multiple style-api docs annotations with the same name: "${name}"`);
    }
    usedSlots.add(name);

    if (tokens !== undefined) {
      slots.push({ name, tokens: tokens.split(/[\s,]+/).filter(Boolean) });
    } else {
      slots.push({ name, forwardsTo: { component, slot } });
    }
  }
  return { slots };
}
