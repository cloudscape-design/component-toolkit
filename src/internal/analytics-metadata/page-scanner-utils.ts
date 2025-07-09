// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { METADATA_ATTRIBUTE, REFERRER_ATTRIBUTE, REFERRER_DATA_ATTRIBUTE } from './attributes';
import { findComponentUp, isNodeComponent } from './dom-utils';
import { getGeneratedAnalyticsMetadata } from './utils';

interface GeneratedAnalyticsMetadataComponentTree {
  name: string;
  label: string;
  properties?: Record<string, string>;
  children?: Array<GeneratedAnalyticsMetadataComponentTree>;
}

interface ComponentsMap {
  roots: Array<HTMLElement>;
  parents: Map<HTMLElement, Array<HTMLElement>>;
}

const findPortalsOutsideOfNode = (node: HTMLElement): Array<HTMLElement> =>
  (Array.from(document.querySelectorAll(`[${REFERRER_ATTRIBUTE}]`)) as Array<HTMLElement>).filter(element => {
    const referrer = element.dataset[REFERRER_DATA_ATTRIBUTE];
    return !!node.querySelector(`[id="${referrer}"]`) && !node.querySelector(`[${REFERRER_ATTRIBUTE}="${referrer}"]`);
  });

const getComponentsArray = (node: HTMLElement | Document = document) => {
  const elementsWithMetadata = Array.from(node.querySelectorAll(`[${METADATA_ATTRIBUTE}]`)) as Array<HTMLElement>;
  findPortalsOutsideOfNode(node as HTMLElement).forEach(portal => {
    elementsWithMetadata.push(...getComponentsArray(portal));
  });
  return elementsWithMetadata.filter(isNodeComponent);
};

const buildComponentsMap = (node: HTMLElement | Document = document) => {
  const componentsArray = getComponentsArray(node);
  const map: ComponentsMap = {
    roots: [],
    parents: new Map<HTMLElement, Array<HTMLElement>>(),
  };
  componentsArray.forEach(element => {
    const parent = element.parentElement ? findComponentUp(element.parentElement, node as HTMLElement) : null;
    if (!parent) {
      map.roots.push(element);
    } else {
      if (!map.parents.has(parent)) {
        map.parents.set(parent, []);
      }
      map.parents.get(parent)?.push(element);
    }
  });
  return map;
};

const getComponentsTreeRecursive = (
  componentNodes: Array<HTMLElement>,
  parentsMap: Map<HTMLElement, Array<HTMLElement>>
): Array<GeneratedAnalyticsMetadataComponentTree> => {
  const tree: Array<GeneratedAnalyticsMetadataComponentTree> = [];
  componentNodes.forEach(componentNode => {
    const treeItem: GeneratedAnalyticsMetadataComponentTree = {
      ...getGeneratedAnalyticsMetadata(componentNode).contexts[0].detail,
    };
    const children = parentsMap.has(componentNode)
      ? getComponentsTreeRecursive(parentsMap.get(componentNode)!, parentsMap)
      : [];
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
  const { roots, parents } = buildComponentsMap(node);
  return getComponentsTreeRecursive(roots, parents);
};
