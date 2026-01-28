// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { METADATA_DATA_ATTRIBUTE } from './attributes.js';
import { GeneratedAnalyticsMetadataFragment, LabelIdentifier } from './interfaces.js';
import { findLogicalParent } from './dom-utils.js';

interface RawAnalyticsMetadata {
  metadata: Array<GeneratedAnalyticsMetadataFragment>;
  labelSelectors: Array<string>;
}
export const getRawAnalyticsMetadata = (target: HTMLElement | null): RawAnalyticsMetadata => {
  const output: RawAnalyticsMetadata = {
    metadata: [],
    labelSelectors: [],
  };
  let currentNode = target;
  while (currentNode) {
    try {
      const currentMetadataString = currentNode.dataset[METADATA_DATA_ATTRIBUTE];
      if (currentMetadataString) {
        const currentMetadata = JSON.parse(currentMetadataString);
        output.metadata.push(currentMetadata);
        output.labelSelectors = [...output.labelSelectors, ...getLabelSelectors(currentMetadata)];
      }
    } catch {
      /* empty */
    } finally {
      currentNode = findLogicalParent(currentNode);
    }
  }
  return output;
};

const getLabelSelectors = (localMetadata: any): Array<string> => {
  return Object.keys(localMetadata).reduce((acc: Array<string>, key: string) => {
    if (key.toLowerCase().match(/label$/)) {
      acc = [...acc, ...getLabelSelectorsFromLabelIdentifier(localMetadata[key])];
    } else if (typeof localMetadata[key] !== 'string') {
      acc = [...acc, ...getLabelSelectors(localMetadata[key])];
    }
    return acc;
  }, []);
};

const getLabelSelectorsFromLabelIdentifier = (label: string | LabelIdentifier): Array<string> => {
  let labels: Array<string> = [];
  if (typeof label === 'string') {
    labels.push(label);
  } else {
    if (label.selector) {
      if (typeof label.selector === 'string') {
        labels.push(label.selector);
      } else {
        labels = [...label.selector];
      }
    }
    if (label.rootSelector) {
      labels.push(label.rootSelector);
    }
  }
  return labels;
};
