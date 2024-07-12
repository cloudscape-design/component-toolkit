// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export { GeneratedAnalyticsMetadataFragment, GeneratedAnalyticsMetadata } from './interfaces';
export {
  getAnalyticsMetadataAttribute,
  copyAnalyticsMetadataAttribute,
  getAnalyticsLabelAttribute,
} from './attributes';
export { getRawAnalyticsMetadata } from './test-utils';

import { METADATA_DATA_ATTRIBUTE } from './attributes';
import { GeneratedAnalyticsMetadata, GeneratedAnalyticsMetadataFragment } from './interfaces';
import { findLogicalParent } from './dom-utils';
import { mergeMetadata, processMetadata } from './metadata-utils';

export const getGeneratedAnalyticsMetadata = (target: HTMLElement | null): GeneratedAnalyticsMetadata => {
  let metadata: GeneratedAnalyticsMetadataFragment = {};
  let currentNode = target;
  while (currentNode) {
    try {
      const currentMetadataString = currentNode.dataset[METADATA_DATA_ATTRIBUTE];
      if (currentMetadataString) {
        const currentMetadata = JSON.parse(currentMetadataString);
        metadata = mergeMetadata(metadata, processMetadata(currentNode, currentMetadata));
      }
    } catch (ex) {
      /* empty */
    } finally {
      currentNode = findLogicalParent(currentNode);
    }
  }
  return metadata as GeneratedAnalyticsMetadata;
};
