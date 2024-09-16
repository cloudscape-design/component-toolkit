// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LABEL_DATA_ATTRIBUTE } from './attributes';
import { findSelectorUp, findComponentUp } from './dom-utils';
import { LabelIdentifier } from './interfaces';

export const processLabel = (node: HTMLElement | null, labelIdentifier: string | LabelIdentifier | null): string => {
  if (labelIdentifier === null) {
    return '';
  }
  const formattedLabelIdentifier = formatLabelIdentifier(labelIdentifier);
  const selector = formattedLabelIdentifier.selector;
  if (Array.isArray(selector)) {
    for (const labelSelector of selector) {
      const label = processSingleLabel(
        node,
        labelSelector,
        formattedLabelIdentifier.root,
        formattedLabelIdentifier.rootSelector
      );
      if (label) {
        return label;
      }
    }
  }
  return processSingleLabel(
    node,
    selector as string,
    formattedLabelIdentifier.root,
    formattedLabelIdentifier.rootSelector
  );
};

const formatLabelIdentifier = (labelIdentifier: string | LabelIdentifier): LabelIdentifier => {
  if (typeof labelIdentifier === 'string') {
    return { selector: labelIdentifier };
  }
  return labelIdentifier;
};

const processSingleLabel = (
  node: HTMLElement | null,
  labelSelector: string,
  root: LabelIdentifier['root'] = 'self',
  rootSelector?: string
): string => {
  if (!node) {
    return '';
  }
  if (rootSelector) {
    return processSingleLabel(findSelectorUp(node, rootSelector), labelSelector);
  }
  if (root === 'component') {
    return processSingleLabel(findComponentUp(node), labelSelector);
  }
  if (root === 'body') {
    return processSingleLabel(document.body, labelSelector);
  }
  let labelElement: HTMLElement | null = node;
  if (labelSelector) {
    labelElement = labelElement.querySelector(labelSelector) as HTMLElement | null;
  }
  if (labelElement && labelElement.dataset[LABEL_DATA_ATTRIBUTE]) {
    return processLabel(labelElement, labelElement.dataset[LABEL_DATA_ATTRIBUTE]);
  }
  return getLabelFromElement(labelElement);
};

export const getLabelFromElement = (element: HTMLElement | null): string => {
  if (!element) {
    return '';
  }
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel.trim();
  }
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const elementWithLabel = document.querySelector(`[id="${ariaLabelledBy.split(' ')[0]}"]`);
    if (elementWithLabel !== element) {
      return getLabelFromElement(elementWithLabel as HTMLElement);
    }
  }

  return element.textContent ? element.textContent.trim() : '';
};
