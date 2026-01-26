// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getTrackableValue, type TrackBy } from '../index';

test('returns the item itself when trackBy is undefined', () => {
  const item = { id: 'a' };
  const result = getTrackableValue(undefined, item);
  expect(result).toBe(item);
});

test('returns the property value when trackBy is a string key', () => {
  const item = { id: 'a', name: 'Alice' };
  const result = getTrackableValue('id', item);
  expect(result).toBe('a');
});

test('returns the property value when trackBy is a number key', () => {
  const item = { id: 123 };
  const result = getTrackableValue('id', item);
  expect(result).toBe(123);
});

test('returns the value from the trackBy function', () => {
  const item = { id: 'a', name: 'Alice' };
  const trackBy: TrackBy<typeof item> = it => `${it.id}:${it.name}`;
  const result = getTrackableValue(trackBy, item);
  expect(result).toBe('a:Alice');
});

test('returns undefined if the key does not exist on the item', () => {
  const item = { id: 'a' };
  const result = getTrackableValue('missingKey' as any, item);
  expect(result).toBeUndefined();
});

test('works with primitive items when trackBy is undefined', () => {
  const item = 'hello';
  const result = getTrackableValue(undefined, item);
  expect(result).toBe('hello');
});
