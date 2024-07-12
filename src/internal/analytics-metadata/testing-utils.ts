// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { METADATA_DATA_ATTRIBUTE } from './attributes';
import { GeneratedAnalyticsMetadataFragment, LabelIdentifier } from './interfaces';
import { findLogicalParent } from './dom-utils';

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
    } catch (ex) {
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
  if (typeof label === 'string') {
    return [label];
  } else if (typeof label.selector === 'string') {
    return [label.selector];
  }
  return label.selector;
};
