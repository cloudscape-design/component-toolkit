// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GeneratedAnalyticsMetadataFragment } from './interfaces.js';
import { processLabel } from './labels-utils.js';
import type { GetComponentsTreeOptions, OptionItem, TabItem } from './page-scanner-utils.js';

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

export const processMetadata = (
  node: HTMLElement | null,
  localMetadata: any,
  options?: GetComponentsTreeOptions
): GeneratedAnalyticsMetadataFragment => {
  return Object.keys(localMetadata).reduce((acc: any, key: string) => {
    if (key.toLowerCase().match(/labels$/)) {
      acc[key] = processLabel(node, localMetadata[key], 'multi');
    } else if (key.toLowerCase().match(/label$/)) {
      acc[key] = processLabel(node, localMetadata[key], 'single');
    } else if (typeof localMetadata[key] !== 'string' && !Array.isArray(localMetadata[key])) {
      acc[key] = processMetadata(node, localMetadata[key], options);
      if (key === 'properties' && localMetadata.name === 'awsui.Table') {
        const selectedItems = getTableSelectedItems(node);
        if (selectedItems.length) {
          acc[key].selectedItemsLabels = selectedItems;
        }
        const columns = getTableColumns(node);
        if (columns.length) {
          acc[key].columnLabels = columns;
        }
        if (options?.includeAllTableRows) {
          const rows = getTableRows(node!);
          if (rows.length) {
            acc[key].rows = rows;
          }
        }
      }
      if (key === 'properties' && (localMetadata.name === 'awsui.RadioGroup' || localMetadata.name === 'awsui.Tiles')) {
        const items = getRadioGroupOptions(node!);
        if (items.length) {
          acc[key].options = items;
        }
      }
      if (key === 'properties' && localMetadata.name === 'awsui.Cards') {
        const items = getCardsItems(node!);
        if (items.length) {
          acc[key].options = items;
        }
      }
      if (key === 'properties' && localMetadata.name === 'awsui.Tabs') {
        const tabs = getTabsItems(node!);
        if (tabs.length) {
          acc[key].tabs = tabs;
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

const getTableRows = (node: HTMLElement): string[][] => {
  const rows = Array.from(node.querySelectorAll('tbody tr'));
  return rows
    .map(row =>
      Array.from(row.querySelectorAll('td, th'))
        .filter(cell => !(cell as HTMLElement).querySelector('input[type="checkbox"], input[type="radio"]'))
        .map(cell => cell.textContent?.trim() || '')
        .filter(Boolean)
    )
    .filter(row => row.length > 0);
};

const resolveInputLabel = (root: HTMLElement, input: HTMLElement): string => {
  const labelledBy = input.getAttribute('aria-labelledby');
  if (labelledBy) {
    const doc = root.ownerDocument || document;
    const labelEl = doc.getElementById(labelledBy.split(' ')[0]);
    if (labelEl?.textContent?.trim()) {
      return labelEl.textContent.trim();
    }
  }
  return input.getAttribute('aria-label') || '';
};

const resolveInputDescription = (root: HTMLElement, input: HTMLElement): string => {
  const describedBy = input.getAttribute('aria-describedby');
  if (describedBy) {
    const doc = root.ownerDocument || document;
    const descEl = doc.getElementById(describedBy.split(' ')[0]);
    return descEl?.textContent?.trim() || '';
  }
  return '';
};

const getRadioGroupOptions = (node: HTMLElement): Array<OptionItem> => {
  const inputs = Array.from(node.querySelectorAll('input[type="radio"]')) as HTMLElement[];
  return inputs
    .map(input => {
      const value = input.getAttribute('value') || '';
      const label = resolveInputLabel(node, input);
      const description = resolveInputDescription(node, input);
      const option: OptionItem = { value, label };
      if (description) {
        option.description = description;
      }
      return option;
    })
    .filter(opt => opt.value || opt.label);
};

const getCardsItems = (node: HTMLElement): Array<OptionItem> => {
  const inputs = Array.from(node.querySelectorAll('input[type="checkbox"], input[type="radio"]')) as HTMLElement[];
  return inputs
    .map(input => {
      const label = resolveInputLabel(node, input);
      const description = resolveInputDescription(node, input);
      let value = '';
      const li = input.closest('li');
      if (li) {
        const metadataStr = (li as HTMLElement).dataset?.awsuiAnalytics;
        if (metadataStr) {
          try {
            const meta = JSON.parse(metadataStr);
            value = meta?.component?.innerContext?.item || '';
          } catch {
            /* empty */
          }
        }
      }
      const item: OptionItem = { value, label };
      if (description) {
        item.description = description;
      }
      return item;
    })
    .filter(opt => opt.value || opt.label);
};

const getTabsItems = (node: HTMLElement): Array<TabItem> => {
  const tabs = Array.from(node.querySelectorAll('[role="tab"]')) as HTMLElement[];
  return tabs
    .map(tab => {
      const id = tab.getAttribute('data-testid') || tab.id || '';
      const label = tab.textContent?.trim() || tab.getAttribute('aria-label') || '';
      const item: TabItem = { value: id, label };
      if (tab.getAttribute('aria-disabled') === 'true') {
        item.disabled = 'true';
      }
      return item;
    })
    .filter(tab => tab.label);
};
