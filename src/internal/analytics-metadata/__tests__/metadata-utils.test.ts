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

  test('extracts table rows when includeAllTableRows option is true', () => {
    const mockTable = document.createElement('table');
    mockTable.innerHTML = `
      <thead><tr><th>Name</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Item 1</td><td>Active</td></tr>
        <tr><td>Item 2</td><td>Inactive</td></tr>
      </tbody>
    `;
    document.body.appendChild(mockTable);

    const result: any = processMetadata(
      mockTable,
      { name: 'awsui.Table', properties: {} },
      { includeAllTableRows: true }
    );
    expect(result.properties.rows).toEqual([
      ['Item 1', 'Active'],
      ['Item 2', 'Inactive'],
    ]);

    document.body.removeChild(mockTable);
  });

  test('does not extract table rows when includeAllTableRows is false or omitted', () => {
    const mockTable = document.createElement('table');
    mockTable.innerHTML = `
      <thead><tr><th>Name</th></tr></thead>
      <tbody><tr><td>Item 1</td></tr></tbody>
    `;
    document.body.appendChild(mockTable);

    const result1: any = processMetadata(mockTable, { name: 'awsui.Table', properties: {} });
    expect(result1.properties.rows).toBeUndefined();

    const result2: any = processMetadata(
      mockTable,
      { name: 'awsui.Table', properties: {} },
      { includeAllTableRows: false }
    );
    expect(result2.properties.rows).toBeUndefined();

    document.body.removeChild(mockTable);
  });

  test('extracts RadioGroup options with value, label, and description', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <div role="radiogroup">
        <span id="label-1">First choice</span>
        <span id="desc-1">Description one</span>
        <input type="radio" value="first" aria-labelledby="label-1" aria-describedby="desc-1" />
        <span id="label-2">Second choice</span>
        <input type="radio" value="second" aria-labelledby="label-2" />
      </div>
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.RadioGroup', properties: { value: 'first' } });
    expect(result.properties.options).toEqual([
      { value: 'first', label: 'First choice', description: 'Description one' },
      { value: 'second', label: 'Second choice' },
    ]);

    document.body.removeChild(mockDiv);
  });

  test('extracts RadioGroup options using aria-label fallback', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <input type="radio" value="opt1" aria-label="Option One" />
      <input type="radio" value="opt2" aria-label="Option Two" />
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.RadioGroup', properties: {} });
    expect(result.properties.options).toEqual([
      { value: 'opt1', label: 'Option One' },
      { value: 'opt2', label: 'Option Two' },
    ]);

    document.body.removeChild(mockDiv);
  });

  test('extracts Tiles options same as RadioGroup', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <span id="t-label-1">Tile A</span>
      <input type="radio" value="a" aria-labelledby="t-label-1" />
      <span id="t-label-2">Tile B</span>
      <input type="radio" value="b" aria-labelledby="t-label-2" />
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.Tiles', properties: { value: 'a' } });
    expect(result.properties.options).toEqual([
      { value: 'a', label: 'Tile A' },
      { value: 'b', label: 'Tile B' },
    ]);

    document.body.removeChild(mockDiv);
  });

  test('extracts Cards items from selection inputs', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <ol>
        <li data-awsui-analytics='{"component":{"innerContext":{"item":"id-1"}}}'>
          <input type="checkbox" aria-label="Select item 1" aria-describedby="card-desc-1" />
          <span id="card-desc-1">Running, t2.micro</span>
        </li>
        <li data-awsui-analytics='{"component":{"innerContext":{"item":"id-2"}}}'>
          <input type="checkbox" aria-label="Select item 2" />
        </li>
      </ol>
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.Cards', properties: {} });
    expect(result.properties.options).toEqual([
      { value: 'id-1', label: 'Select item 1', description: 'Running, t2.micro' },
      { value: 'id-2', label: 'Select item 2' },
    ]);

    document.body.removeChild(mockDiv);
  });

  test('extracts Tabs items from role=tab elements', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <div role="tablist">
        <button role="tab" data-testid="details" id="tab-1">Details</button>
        <button role="tab" data-testid="monitoring" id="tab-2">Monitoring</button>
        <button role="tab" data-testid="tags" id="tab-3" aria-disabled="true">Tags</button>
      </div>
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.Tabs', properties: { tabsCount: '3' } });
    expect(result.properties.tabs).toEqual([
      { value: 'details', label: 'Details' },
      { value: 'monitoring', label: 'Monitoring' },
      { value: 'tags', label: 'Tags', disabled: 'true' },
    ]);

    document.body.removeChild(mockDiv);
  });

  test('does not extract options for non-matching components', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `<input type="radio" value="x" aria-label="X" />`;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.Button', properties: {} });
    expect(result.properties.options).toBeUndefined();
    expect(result.properties.tabs).toBeUndefined();

    document.body.removeChild(mockDiv);
  });

  test('extracts component description from aria-describedby on label element', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <span id="desc-1">Must be 3-20 characters</span>
      <input aria-describedby="desc-1" />
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.Input', label: 'input' });
    expect(result.description).toBe('Must be 3-20 characters');

    document.body.removeChild(mockDiv);
  });

  test('concatenates multiple aria-describedby IDs', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <span id="desc-a">Enter your work email</span>
      <span id="desc-b">Must end with @amazon.com</span>
      <input aria-describedby="desc-a desc-b" />
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.Input', label: 'input' });
    expect(result.description).toBe('Enter your work email Must end with @amazon.com');

    document.body.removeChild(mockDiv);
  });

  test('does not extract description when label element has no aria-describedby', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <label class="label">Form field label</label>
      <div id="ff-desc">This is a description</div>
      <input aria-describedby="ff-desc" />
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.FormField', label: '.label' });
    expect(result.description).toBeUndefined();

    document.body.removeChild(mockDiv);
  });

  test('does not extract description when component has no label selector', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <span id="desc-1">Some description</span>
      <input aria-describedby="desc-1" />
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.Input' });
    expect(result.description).toBeUndefined();

    document.body.removeChild(mockDiv);
  });

  test('does not extract description from child elements', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <div id="ff-desc">This is a description</div>
      <input aria-describedby="ff-desc" />
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.FormField', label: '.label' });
    expect(result.description).toBeUndefined();

    document.body.removeChild(mockDiv);
  });

  test('skips missing IDs in aria-describedby', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <span id="desc-exists">Constraint text</span>
      <input aria-describedby="desc-missing desc-exists" />
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, { name: 'awsui.Input', label: 'input' });
    expect(result.description).toBe('Constraint text');

    document.body.removeChild(mockDiv);
  });

  test('extracts description when label is a LabelIdentifier with array selector', () => {
    const mockDiv = document.createElement('div');
    mockDiv.innerHTML = `
      <span id="desc-1">Help text</span>
      <span class="header">Title</span>
      <button class="trigger" aria-describedby="desc-1">Select</button>
    `;
    document.body.appendChild(mockDiv);

    const result: any = processMetadata(mockDiv, {
      name: 'awsui.Select',
      label: { selector: ['.header', '.trigger'] },
    });
    expect(result.description).toBe('Help text');

    document.body.removeChild(mockDiv);
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
