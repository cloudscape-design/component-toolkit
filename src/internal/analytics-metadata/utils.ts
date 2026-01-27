// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export { getRawAnalyticsMetadata } from './testing-utils.js';
export { getComponentsTree } from './page-scanner-utils.js';

import { METADATA_DATA_ATTRIBUTE } from './attributes.js';
import { GeneratedAnalyticsMetadata, GeneratedAnalyticsMetadataFragment } from './interfaces.js';
import { findLogicalParent } from './dom-utils.js';
import { mergeMetadata, processMetadata } from './metadata-utils.js';

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
    } catch {
      /* empty */
    } finally {
      currentNode = findLogicalParent(currentNode);
    }
  }
  return metadata as GeneratedAnalyticsMetadata;
};
