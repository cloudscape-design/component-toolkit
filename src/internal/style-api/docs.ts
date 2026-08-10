// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Extracts the Style API documentation surface from a component's *compiled* CSS.
//
// Slots are declared explicitly by the author with the `style-api.docs($name, $tokens)` mixin, which
// emits a machine-readable marker comment into the compiled CSS:
//
//   /* awsui:style-api-slot name=<slot> tokens=<t1>, <t2> */
//
// This module parses those markers.

const MARKER = /awsui:style-api-slot\s+name=([\w-]+)\s+tokens=([^*]*)\*\//g;

export interface StyleApiDocs {
  /**
   * The component's themeable slots (defined by classNames), each with its own set of style tokens.
   */
  slots: StyleApiSlotDocs[];
}

export interface StyleApiSlotDocs {
  /**
   * The first argument of `style-api.docs(...)` - must match the corresponding classNames slot.
   */
  name: string;
  /**
   * The public style tokens this slot supports (without "--awsui-style" prefix).
   */
  tokens: string[];
}

/**
 * Extracts the Style API slot documentation from a component's compiled CSS by reading the
 * explicit slot markers emitted by `style-api.docs(...)`.
 */
export function extractStyleApiDocs(css: string): StyleApiDocs {
  const slots = new Array<StyleApiSlotDocs>();
  const usedSlots = new Set<string>();

  for (const match of css.matchAll(MARKER)) {
    const name = match[1];
    const tokens = match[2].split(/[\s,]+/).filter(Boolean);
    slots.push({ name, tokens });
    if (!usedSlots.has(name)) {
      usedSlots.add(name);
    } else {
      throw new Error(`Found multiple style-api.docs(...) annotations with the same name: "${name}"`);
    }
  }
  return { slots };
}
