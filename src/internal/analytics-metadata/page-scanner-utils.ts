// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { METADATA_ATTRIBUTE } from './attributes';
import { isNodeComponent } from './dom-utils';
import { getGeneratedAnalyticsMetadata } from './utils';

interface GeneratedAnalyticsMetadataComponentTree {
  name: string;
  label: string;
  properties?: Record<string, string>;
  children?: Array<GeneratedAnalyticsMetadataComponentTree>;
}

const getComponentsArray = (node: HTMLElement | Document = document) => {
  const elementsWithMetadata = Array.from(node.querySelectorAll(`[${METADATA_ATTRIBUTE}]`)) as Array<HTMLElement>;
  return elementsWithMetadata.filter(isNodeComponent);
};

const getComponentsTreeRecursive = (
  node: HTMLElement | Document,
  visited: Set<HTMLElement>
): Array<GeneratedAnalyticsMetadataComponentTree> => {
  const tree: Array<GeneratedAnalyticsMetadataComponentTree> = [];
  const componentNodes = getComponentsArray(node);
  componentNodes.forEach(componentNode => {
    if (visited.has(componentNode)) {
      return;
    }
    visited.add(componentNode);
    const treeItem: GeneratedAnalyticsMetadataComponentTree = {
      ...getGeneratedAnalyticsMetadata(componentNode).contexts[0].detail,
    };
    const children = getComponentsTreeRecursive(componentNode, visited);
    if (children.length > 0) {
      treeItem.children = children;
    }
    tree.push(treeItem);
  });
  return tree;
};

export const getComponentsTree = (
  node: HTMLElement | Document | null = document
): Array<GeneratedAnalyticsMetadataComponentTree> => {
  if (!node) {
    return [];
  }
  return getComponentsTreeRecursive(node, new Set());
};
