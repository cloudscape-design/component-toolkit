/**
 * @jest-environment node
 */
/* eslint-disable header/header */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as globalFlags from '../';
import { awsuiGlobalFlagsSymbol, FlagsHolder } from '../';
const { getGlobalFlag, setGlobalFlag } = globalFlags;

const globalWithFlags = globalThis as FlagsHolder;

afterEach(() => {
  delete globalWithFlags[awsuiGlobalFlagsSymbol];
});

describe('getGlobalFlag', () => {
  test('ensure no window in this environment', () => {
    expect(typeof window === 'undefined').toBe(true);
  });

  test('returns undefined if the global flags object does not exist', () => {
    expect(getGlobalFlag('appLayoutWidget')).toBeUndefined();
  });
  test('returns undefined if the global flags object exists but the flag is not set', () => {
    globalWithFlags[awsuiGlobalFlagsSymbol] = {};
    expect(getGlobalFlag('appLayoutWidget')).toBeUndefined();
  });
  test('returns appLayoutWidget value when defined', () => {
    globalWithFlags[awsuiGlobalFlagsSymbol] = { appLayoutWidget: false };
    expect(getGlobalFlag('appLayoutWidget')).toBe(false);
    globalWithFlags[awsuiGlobalFlagsSymbol].appLayoutWidget = true;
    expect(getGlobalFlag('appLayoutWidget')).toBe(true);
  });
});

describe('setGlobalFlag', () => {
  test('sets value if global flag object exists', () => {
    globalWithFlags[awsuiGlobalFlagsSymbol] = {};
    setGlobalFlag('appLayoutWidget', true);
    expect(getGlobalFlag('appLayoutWidget')).toBe(true);
    setGlobalFlag('appLayoutWidget', false);
    expect(getGlobalFlag('appLayoutWidget')).toBe(false);
  });
  test('sets value if global flag object does not exist', () => {
    setGlobalFlag('appLayoutWidget', true);
    expect(getGlobalFlag('appLayoutWidget')).toBe(true);
  });
  test('sets value if flag already exists', () => {
    globalWithFlags[awsuiGlobalFlagsSymbol] = { appLayoutWidget: false };
    setGlobalFlag('appLayoutWidget', true);
    expect(getGlobalFlag('appLayoutWidget')).toBe(true);
  });
  test('does not create global flag object if value is undefined', () => {
    setGlobalFlag('appLayoutWidget', undefined);
    expect(globalWithFlags[awsuiGlobalFlagsSymbol]).toBeUndefined();
  });
  test('removes flag if value is undefined', () => {
    globalWithFlags[awsuiGlobalFlagsSymbol] = { appLayoutWidget: false };
    setGlobalFlag('appLayoutWidget', undefined);
    expect(Object.keys(globalWithFlags[awsuiGlobalFlagsSymbol]).length).toBe(0);
  });
});
