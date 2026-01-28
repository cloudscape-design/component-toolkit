// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GeneratedAnalyticsMetadataFragment } from './interfaces.js';
import { processLabel } from './labels-utils.js';

export const mergeMetadata = (
  metadata: GeneratedAnalyticsMetadataFragment | null,
  localMetadata: GeneratedAnalyticsMetadataFragment | null
) => {
  const output = merge(metadata, localMetadata);
  if (output.component && output.component.name) {
    output.contexts = [...(output.contexts || []), { type: 'component', detail: output.component }];
    delete output.component;
  }
  return output;
};

export const processMetadata = (node: HTMLElement | null, localMetadata: any): GeneratedAnalyticsMetadataFragment => {
  return Object.keys(localMetadata).reduce((acc: any, key: string) => {
    if (key.toLowerCase().match(/labels$/)) {
      acc[key] = processLabel(node, localMetadata[key], 'multi');
    } else if (key.toLowerCase().match(/label$/)) {
      acc[key] = processLabel(node, localMetadata[key], 'single');
    } else if (typeof localMetadata[key] !== 'string' && !Array.isArray(localMetadata[key])) {
      acc[key] = processMetadata(node, localMetadata[key]);
      if (key === 'properties' && localMetadata.name === 'awsui.Table') {
        const selectedItems = getTableSelectedItems(node);
        if (selectedItems.length) {
          acc[key].selectedItemsLabels = selectedItems;
        }
        const columns = getTableColumns(node);
        if (columns.length) {
          acc[key].columnLabels = columns;
        }
      }
    } else {
      acc[key] = localMetadata[key];
    }
    return acc;
  }, {});
};

const isNil = (value: any) => {
  return typeof value === 'undefined' || value === null;
};

export const merge = (inputTarget: any, inputSource: any): any => {
  const merged: any = {};
  const target = inputTarget || {};
  const source = inputSource || {};
  const targetKeys = Object.keys(target);
  const sourceKeys = Object.keys(source);
  const allKeys = new Set([...targetKeys, ...sourceKeys]);
  for (const key of allKeys) {
    if (target[key] && !source[key]) {
      merged[key] = target[key];
    } else if (!target[key] && !isNil(source[key])) {
      merged[key] = source[key];
    } else if (typeof target[key] === 'string' || Array.isArray(target[key])) {
      merged[key] = source[key];
    } else {
      merged[key] = merge(target[key], source[key]);
    }
  }
  return JSON.parse(JSON.stringify(merged));
};

const getTableSelectedItems = (node: HTMLElement | null): string[][] => {
  if (!node) {
    return [];
  }

  return Array.from(node.querySelectorAll('tr[data-selection-item="item"]'))
    .filter(row => row.querySelector('input:checked') || row.getAttribute('aria-selected') === 'true')
    .map(row =>
      Array.from(row.querySelectorAll('td, th'))
        .filter(cell => !cell.querySelector('input'))
        .map(cell => cell.textContent?.trim() || '')
        .filter(Boolean)
    )
    .filter(row => row.length > 0);
};

const getTableColumns = (node: HTMLElement | null): string[] => {
  if (!node) {
    return [];
  }

  const headerRow = node.querySelector('thead tr, tr:first-child');
  return headerRow
    ? Array.from(headerRow.querySelectorAll('th, td'))
        .filter(cell => !(cell as HTMLElement).className.includes('selection-control'))
        .map(cell => cell.textContent?.trim() || '')
        .filter(Boolean)
    : [];
};
