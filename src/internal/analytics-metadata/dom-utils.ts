// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { METADATA_DATA_ATTRIBUTE, REFERRER_ATTRIBUTE, REFERRER_DATA_ATTRIBUTE } from './attributes';

export const findLogicalParent = (node: HTMLElement): HTMLElement | null => {
  try {
    const referrer = node.dataset[REFERRER_DATA_ATTRIBUTE];
    if (referrer) {
      return document.querySelector(`[id="${referrer}"]`);
    }
    return node.parentElement;
  } catch (ex) {
    return null;
  }
};

export function findComponentUp(node: HTMLElement | null): HTMLElement | null {
  let firstComponentElement = node;
  while (firstComponentElement && firstComponentElement.tagName !== 'body' && !isNodeComponent(firstComponentElement)) {
    firstComponentElement = findLogicalParent(firstComponentElement);
  }
  return firstComponentElement && firstComponentElement.tagName !== 'body' ? firstComponentElement : null;
}

export const isNodeComponent = (node: HTMLElement): boolean => {
  const metadataString = node.dataset[METADATA_DATA_ATTRIBUTE];
  if (!metadataString) {
    return false;
  }
  try {
    const metadata = JSON.parse(metadataString);
    return !!metadata.component && !!metadata.component.name;
  } catch (ex) {
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

export const findPortals = (node: HTMLElement): Array<HTMLElement> =>
  Array.from(node.querySelectorAll(`[${REFERRER_ATTRIBUTE}]`))
    .map(element => findLogicalParent(element as HTMLElement))
    .filter(element => !!element) as Array<HTMLElement>;
