// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GeneratedAnalyticsMetadataFragment } from '../interfaces';
import { merge, mergeMetadata, processMetadata } from '../metadata-utils';

jest.mock('../labels-utils', () => ({
  processLabel: (node: HTMLElement | null, label: string) => `processed-${label}`,
}));

describe('processMetadata', () => {
  test('recursively identifies elements ending with "label"', () => {
    expect(processMetadata(null, { label: 'a', entry: { columnLabel: 'b', notLabelEnding: 'c' } })).toEqual({
      label: 'processed-a',
      entry: { columnLabel: 'processed-b', notLabelEnding: 'c' },
    });
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
