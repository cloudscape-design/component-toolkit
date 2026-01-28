// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { METADATA_DATA_ATTRIBUTE, REFERRER_DATA_ATTRIBUTE } from './attributes.js';

export const findLogicalParent = (node: HTMLElement): HTMLElement | null => {
  try {
    const referrer = node.dataset[REFERRER_DATA_ATTRIBUTE];
    if (referrer) {
      return (node.ownerDocument || node).querySelector(`[id="${referrer}"]`);
    }
    return node.parentElement;
  } catch {
    return null;
  }
};

export function findComponentUpUntil(node: HTMLElement | null, until: HTMLElement = document.body): HTMLElement | null {
  let firstComponentElement = node;
  while (firstComponentElement && firstComponentElement !== until && !isNodeComponent(firstComponentElement)) {
    firstComponentElement = findLogicalParent(firstComponentElement);
  }
  return firstComponentElement && isNodeComponent(firstComponentElement) ? firstComponentElement : null;
}

export const isNodeComponent = (node: HTMLElement): boolean => {
  const metadataString = node.dataset[METADATA_DATA_ATTRIBUTE];
  if (!metadataString) {
    return false;
  }
  try {
    const metadata = JSON.parse(metadataString);
    return !!metadata.component && !!metadata.component.name;
  } catch {
    return false;
  }
};

export function findSelectorUp(node: HTMLElement | null, selector: string): HTMLElement | null {
  let current: HTMLElement | null = node;
  while (current && current.tagName !== 'body' && !current.matches(selector)) {
    current = findLogicalParent(current);
  }
  return current && current.tagName !== 'body' ? current : null;
}
