// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Extracts the Style API documentation surface from a component's *compiled* CSS.
//
// Slots are declared explicitly by the author with the style-api docs mixins, which emit a
// machine-readable marker comment into the compiled CSS. Two forms exist:
//
//   token slot   — `@include style-api.docs($name, $tokens, $properties)`:
//     /* awsui:style-api-slot name=<slot> tokens=<t1>, <t2> properties=<p1>, <p2> */
//
//   forward slot — `@include style-api.docs-forward($name, $component, $slot)`:
//     /* awsui:style-api-slot name=<slot> component=<component> slot=<target-slot> */
//
// A forward slot reuses another component's slot (e.g. a nested Button) instead of owning tokens;
// the docs consumer resolves it to that component's slot, so it never goes stale.
//
// docs() also emits one description marker per described slot, token or property:
//     /* awsui:style-api-description slot=<slot> kind=<slot|token|property> name=<name> text=<text> */

// The properties an allowlisted shorthand expands to. Allowlists name the shorthand, never one of its
// expansions. The order is general to specific: the slot mixins emit declarations in this order, so
// a more specific one wins.
const PROPERTY_EXPANSIONS: Record<string, string[]> = {
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

const MARKER =
  /awsui:style-api-slot\s+name=([\w-]+)\s+(?:tokens=([^*]*?)\s+properties=([^*]*)|component=([\w-]+)\s+slot=([\w-]+)\s*)\*\//;

const DESCRIPTION_MARKER =
  /awsui:style-api-description\s+slot=([\w-]+)\s+kind=(slot|token|property)\s+name=([\w-]+)\s+text=([^*]*?)\s*\*\//;

// Match any marker of a kind loosely (just the sentinel up to the comment close). We use these to detect
// markers that the strict patterns fail to parse — e.g. a name or token containing a space.
const MARKER_LOOSE = /awsui:style-api-slot[\s\S]*?\*\//g;
const DESCRIPTION_MARKER_LOOSE = /awsui:style-api-description[\s\S]*?\*\//g;

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
   * Description of the slot. Present when provided.
   */
  description?: string;
  /**
   * The public style tokens this slot supports (without "--awsui-style" prefix).
   */
  tokens: string[];
  /**
   * Descriptions of the tokens, by token name.
   */
  tokenDescriptions: Record<string, string>;
  /**
   * The CSS properties consumers may set directly on the slot element. Allowlisted shorthands
   * (`padding`, `border`, `border-radius`) are expanded to the longhands consumers may set as well.
   */
  properties: string[];
  /**
   * Descriptions of the allowlisted properties, by property name.
   */
  propertyDescriptions: Record<string, string>;
}

export interface StyleApiForwardSlotDocs extends StyleApiSlotDocsBase {
  /**
   * The slot this one forwards to. Its tokens are whatever the referenced component's slot documents.
   */
  forwardsTo: { component: string; slot: string };
}

/**
 * Extracts the Style API slot documentation from a component's compiled CSS by reading the explicit
 * markers emitted by the style-api docs mixins.
 */
export function extractStyleApiDocs(css: string): StyleApiDocs {
  const slots = new Array<StyleApiSlotDocs>();
  const slotsByName = new Map<string, StyleApiSlotDocs>();

  for (const raw of matchAll(css, MARKER_LOOSE)) {
    const match = parse(raw, MARKER);
    const [, name, tokens, properties, component, slot] = match;
    if (slotsByName.has(name)) {
      throw new Error(`Found multiple style-api docs annotations with the same name: "${name}"`);
    }
    let slotDocs: StyleApiSlotDocs;
    if (tokens !== undefined) {
      const tokenSlot: StyleApiTokenSlotDocs = {
        name,
        tokens: splitList(tokens),
        tokenDescriptions: {},
        properties: expandProperties(name, splitList(properties)),
        propertyDescriptions: {},
      };
      const clash = tokenSlot.tokens.find(token => tokenSlot.properties.includes(token));
      if (clash) {
        throw new Error(`Slot "${name}" declares "${clash}" as both a token and a property.`);
      }
      slotDocs = tokenSlot;
    } else {
      slotDocs = { name, forwardsTo: { component, slot } };
    }
    slots.push(slotDocs);
    slotsByName.set(name, slotDocs);
  }

  for (const raw of matchAll(css, DESCRIPTION_MARKER_LOOSE)) {
    const [, slotName, kind, name, text] = parse(raw, DESCRIPTION_MARKER);
    const slot = getTokenSlot(slotsByName, slotName, raw);
    if (kind === 'slot') {
      slot.description = text;
      continue;
    }
    const described = kind === 'token' ? slot.tokens : slot.properties;
    if (!described.includes(name)) {
      throw new Error(`Found a style-api description for an undeclared ${kind} "${name}" in slot "${slotName}"`);
    }
    const descriptions = kind === 'token' ? slot.tokenDescriptions : slot.propertyDescriptions;
    descriptions[name] = text;
  }

  return { slots };
}

function matchAll(css: string, pattern: RegExp): string[] {
  return Array.from(css.matchAll(pattern), match => match[0]);
}

function parse(raw: string, pattern: RegExp): RegExpExecArray {
  const match = pattern.exec(raw);
  if (!match) {
    throw new Error(`Found a malformed style-api docs annotation: "${raw}"`);
  }
  return match;
}

function expandProperties(slot: string, properties: string[]): string[] {
  for (const property of properties) {
    const shorthand = Object.keys(PROPERTY_EXPANSIONS).find(key => PROPERTY_EXPANSIONS[key].includes(property));
    if (shorthand && shorthand !== property) {
      throw new Error(`Slot "${slot}" allowlists "${property}". Allow "${shorthand}" instead.`);
    }
  }
  return properties.flatMap(property => PROPERTY_EXPANSIONS[property] ?? [property]);
}

function splitList(list: string): string[] {
  return list.split(/[\s,]+/).filter(Boolean);
}

function getTokenSlot(slotsByName: Map<string, StyleApiSlotDocs>, name: string, raw: string): StyleApiTokenSlotDocs {
  const slot = slotsByName.get(name);
  if (!slot || !('tokens' in slot)) {
    throw new Error(`Found a style-api docs annotation for an undeclared or forwarding slot "${name}": "${raw}"`);
  }
  return slot;
}
