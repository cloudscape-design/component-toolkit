// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GeneratedAnalyticsMetadataFragment } from '../interfaces';
import { merge, mergeMetadata, processMetadata } from '../metadata-utils';

jest.mock('../labels-utils', () => ({
  processLabel: (node: HTMLElement | null, label: string, mode?: string) =>
    mode === 'multi' ? [`processed-${label}-multi`] : `processed-${label}`,
}));

describe('processMetadata', () => {
  test('recursively identifies elements ending with "label"', () => {
    expect(processMetadata(null, { label: 'a', entry: { columnLabel: 'b', notLabelEnding: 'c' } })).toEqual({
      label: 'processed-a',
      entry: { columnLabel: 'processed-b', notLabelEnding: 'c' },
    });
  });

  test('handles keys ending with "labels" in multi mode', () => {
    expect(processMetadata(null, { labels: 'items', entry: { columnLabels: 'cols' } })).toEqual({
      labels: ['processed-items-multi'],
      entry: { columnLabels: ['processed-cols-multi'] },
    });
  });

  test('distinguishes between "label" (single) and "labels" (multi)', () => {
    expect(processMetadata(null, { label: 'single', labels: 'multi' })).toEqual({
      label: 'processed-single',
      labels: ['processed-multi-multi'],
    });
  });

  test('handles table metadata for awsui.Table components', () => {
    // Create a mock table structure
    const mockTable = document.createElement('table');
    mockTable.innerHTML = `
      <thead>
        <tr>
          <th class="selection-control"><input type="checkbox" /></th>
          <th>Name</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr data-selection-item="item">
          <td><input type="checkbox" checked /></td>
          <td>Item 1</td>
          <td>Active</td>
        </tr>
        <tr data-selection-item="item">
          <td><input type="checkbox" /></td>
          <td>Item 2</td>
          <td>Inactive</td>
        </tr>
        <tr data-selection-item="item" aria-selected="true">
          <td><input type="checkbox" /></td>
          <td>Item 3</td>
          <td>Active</td>
        </tr>
      </tbody>
    `;
    document.body.appendChild(mockTable);

    const result: any = processMetadata(mockTable, {
      name: 'awsui.Table',
      properties: { variant: 'default' },
    });

    expect(result.properties.variant).toEqual('default');
    expect(result.properties.selectedItemsLabels).toEqual([
      ['Item 1', 'Active'],
      ['Item 3', 'Active'],
    ]);
    expect(result.properties.columnLabels).toEqual(['Name', 'Status']);

    document.body.removeChild(mockTable);
  });

  test('does not add table metadata for non-Table components', () => {
    const mockDiv = document.createElement('div');
    const result: any = processMetadata(mockDiv, {
      name: 'awsui.Button',
      properties: { variant: 'primary' },
    });

    expect(result.properties.variant).toEqual('primary');
    expect(result.properties.selectedItemsLabels).toBeUndefined();
    expect(result.properties.columnLabels).toBeUndefined();
  });

  test('handles empty table without selected items', () => {
    const mockTable = document.createElement('table');
    mockTable.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr data-selection-item="item">
          <td><input type="checkbox" /></td>
          <td>Item 1</td>
        </tr>
      </tbody>
    `;
    document.body.appendChild(mockTable);

    const result: any = processMetadata(mockTable, {
      name: 'awsui.Table',
      properties: {},
    });

    expect(result.properties.selectedItemsLabels).toBeUndefined();
    expect(result.properties.columnLabels).toEqual(['Name']);

    document.body.removeChild(mockTable);
  });

  test('handles table with nested tables correctly', () => {
    const mockTable = document.createElement('table');
    mockTable.innerHTML = `
      <tbody>
        <tr data-selection-item="item">
          <td><input type="checkbox" checked /></td>
          <td>Outer Item</td>
          <td>
            <table>
              <tr data-selection-item="item">
                <td><input type="checkbox" checked /></td>
                <td>Inner Item</td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    `;
    document.body.appendChild(mockTable);

    const result: any = processMetadata(mockTable, {
      name: 'awsui.Table',
      properties: {},
    });

    // Both outer and inner table items should be included
    expect(result.properties.selectedItemsLabels).toHaveLength(2);
    expect(result.properties.selectedItemsLabels[0]).toContain('Outer Item');
    expect(result.properties.selectedItemsLabels[1]).toContain('Inner Item');

    document.body.removeChild(mockTable);
  });

  test('handles null node for Table component gracefully', () => {
    const result: any = processMetadata(null, {
      name: 'awsui.Table',
      properties: { variant: 'default' },
    });

    expect(result.properties.variant).toEqual('default');
    expect(result.properties.selectedItemsLabels).toBeUndefined();
    expect(result.properties.columnLabels).toBeUndefined();
  });

  test('handles table without any rows', () => {
    const mockTable = document.createElement('table');
    mockTable.innerHTML = `
      <caption>Empty table</caption>
    `;
    document.body.appendChild(mockTable);

    const result: any = processMetadata(mockTable, {
      name: 'awsui.Table',
      properties: {},
    });

    expect(result.properties.columnLabels).toBeUndefined();

    document.body.removeChild(mockTable);
  });
});

describe('merge', () => {
  test('returns target when source is null', () => {
    const target = { one: { three: 'three' } };
    expect(merge(target, null)).toEqual(target);
  });
  test('returns source when target is null', () => {
    const source = { one: { three: 'three' } };
    expect(merge(null, source)).toEqual(source);
  });
  test('returns empty object when both source and target are null', () => {
    expect(merge(null, null)).toEqual({});
  });
  test('merges keys when not defined in target', () => {
    const source = { one: { two: 'two' }, three: 'three' };
    const target = { six: { seven: 'seven' }, eight: 'eight' };
    expect(merge(target, source)).toEqual({ ...source, ...target });
  });
  test('overrides string values recursively', () => {
    const source = { one: { two: 'two' }, three: 'three' };
    const target = { one: { two: 'two-old' }, three: 'three-old' };
    expect(merge(target, source)).toEqual(source);
  });
  test('recursively merges keys when not defined in nested target', () => {
    const source = { one: { two: 'two', four: '' } };
    const target = { one: { three: 'three' } };
    expect(merge(target, source)).toEqual({ one: { two: 'two', three: 'three', four: '' } });
  });
  test('copies arrays in target', () => {
    const source = { two: 'two' };
    const target = { one: ['three', 'four'] };
    expect(merge(target, source)).toEqual({ one: ['three', 'four'], two: 'two' });
  });
});

describe('mergeMetadata', () => {
  test('returns empty object when both arguments are null', () => {
    expect(mergeMetadata(null, null)).toEqual({});
  });
  test('adds component to empty context', () => {
    const componentMetadata = { component: { name: 'ComponentName', label: 'label' } };
    expect(mergeMetadata(null, componentMetadata)).toEqual({
      contexts: [{ type: 'component', detail: componentMetadata.component }],
    });
  });
  test('adds component to existing context as last element', () => {
    const contexts: GeneratedAnalyticsMetadataFragment['contexts'] = [
      { type: 'component', detail: { name: 'c1', label: 'label' } },
    ];
    const componentMetadata = { component: { name: 'ComponentName', label: 'label' } };
    expect(mergeMetadata({ contexts }, componentMetadata)).toEqual({
      contexts: [...contexts, { type: 'component', detail: componentMetadata.component }],
    });
  });
  test('does not add component to contexts if component name is not specified', () => {
    const componentMetadata = { component: { label: 'label' } };
    expect(mergeMetadata(null, componentMetadata)).toEqual(componentMetadata);
  });
});
