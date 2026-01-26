// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LABEL_DATA_ATTRIBUTE } from './attributes';
import { findSelectorUp, findComponentUpUntil } from './dom-utils';
import { LabelIdentifier, LabelSelectionMode } from './interfaces';

export const processLabel = (
  node: HTMLElement | null,
  labelIdentifier: string | LabelIdentifier | null,
  selectionMode: LabelSelectionMode = 'single'
): string | string[] | string[][] => {
  if (selectionMode === 'multi') {
    return processMultiLabels(node, labelIdentifier);
  }
  return processSingleLabel(node, labelIdentifier);
};

const processSingleLabel = (node: HTMLElement | null, labelIdentifier: string | LabelIdentifier | null): string => {
  if (labelIdentifier === null) {
    return '';
  }
  const formattedLabelIdentifier = formatLabelIdentifier(labelIdentifier);
  const selector = formattedLabelIdentifier.selector;

  if (Array.isArray(selector)) {
    for (const labelSelector of selector) {
      const label = processSingleLabelInternal(
        node,
        labelSelector,
        formattedLabelIdentifier.root,
        formattedLabelIdentifier.rootSelector
      );
      if (label) {
        return label;
      }
    }
    return '';
  }
  return processSingleLabelInternal(
    node,
    selector as string,
    formattedLabelIdentifier.root,
    formattedLabelIdentifier.rootSelector
  );
};

const processMultiLabels = (node: HTMLElement | null, labelIdentifier: string | LabelIdentifier | null): string[] => {
  if (labelIdentifier === null) {
    return [];
  }
  const formattedLabelIdentifier = formatLabelIdentifier(labelIdentifier);
  const selector = formattedLabelIdentifier.selector;

  if (Array.isArray(selector)) {
    for (const labelSelector of selector) {
      const labels = processMultiLabelsInternal(
        node,
        labelSelector,
        formattedLabelIdentifier.root,
        formattedLabelIdentifier.rootSelector
      );

      if (labels.length > 0) {
        return labels;
      }
    }
    return [];
  }

  return processMultiLabelsInternal(
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

const processSingleLabelInternal = (
  node: HTMLElement | null,
  labelSelector: string,
  root: LabelIdentifier['root'] = 'self',
  rootSelector?: string
): string => {
  if (!node) {
    return '';
  }
  if (rootSelector) {
    return processSingleLabelInternal(findSelectorUp(node, rootSelector), labelSelector);
  }
  if (root === 'component') {
    return processSingleLabelInternal(findComponentUpUntil(node), labelSelector);
  }
  if (root === 'body') {
    return processSingleLabelInternal(node.ownerDocument.body, labelSelector);
  }

  let labelElement: HTMLElement | null = node;

  if (labelSelector) {
    labelElement = labelElement.querySelector(labelSelector) as HTMLElement | null;
  }
  if (labelElement && labelElement.dataset[LABEL_DATA_ATTRIBUTE]) {
    return processSingleLabel(labelElement, labelElement.dataset[LABEL_DATA_ATTRIBUTE]);
  }
  return getLabelFromElement(labelElement);
};

const processMultiLabelsInternal = (
  node: HTMLElement | null,
  labelSelector: string,
  root: LabelIdentifier['root'] = 'self',
  rootSelector?: string
): string[] => {
  if (!node) {
    return [];
  }
  if (rootSelector) {
    return processMultiLabelsInternal(findSelectorUp(node, rootSelector), labelSelector);
  }
  if (root === 'component') {
    return processMultiLabelsInternal(findComponentUpUntil(node), labelSelector);
  }
  if (root === 'body') {
    return processMultiLabelsInternal(node.ownerDocument.body, labelSelector);
  }

  const elements = Array.from(node.querySelectorAll(labelSelector)) as HTMLElement[];
  return elements
    .map(el => {
      if (el.dataset[LABEL_DATA_ATTRIBUTE]) {
        return processMultiLabels(el, el.dataset[LABEL_DATA_ATTRIBUTE]);
      }
      return getLabelFromElement(el);
    })
    .flat()
    .filter(label => label) as string[];
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
