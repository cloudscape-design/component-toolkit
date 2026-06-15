/**
 * @jest-environment node
 */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { isThemeActive, Theme } from '../index';
import { awsuiGlobalFlagsSymbol, awsuiVisualRefreshFlag, FlagsHolder } from '../../global-flags';

const globalWithFlags = globalThis as FlagsHolder;

afterEach(() => {
  delete globalWithFlags[awsuiVisualRefreshFlag];
  delete globalWithFlags[awsuiGlobalFlagsSymbol];
});

test('ensure no window in this environment', () => {
  expect(typeof window === 'undefined').toBe(true);
});

describe('Theme.VisualRefresh', () => {
  test('returns false by default', () => {
    expect(isThemeActive(Theme.VisualRefresh)).toBe(false);
  });

  test('returns true when awsui-visual-refresh-flag is set on globalThis', () => {
    globalWithFlags[awsuiVisualRefreshFlag] = () => true;
    expect(isThemeActive(Theme.VisualRefresh)).toBe(true);
  });

  test('returns false when awsui-visual-refresh-flag returns false', () => {
    globalWithFlags[awsuiVisualRefreshFlag] = () => false;
    expect(isThemeActive(Theme.VisualRefresh)).toBe(false);
  });
});

describe('Theme.OneTheme', () => {
  test('returns false by default', () => {
    expect(isThemeActive(Theme.OneTheme)).toBe(false);
  });

  test('returns true when oneTheme global flag is set on globalThis', () => {
    globalWithFlags[awsuiGlobalFlagsSymbol] = { oneTheme: true };
    expect(isThemeActive(Theme.OneTheme)).toBe(true);
  });

  test('returns false when oneTheme global flag is false', () => {
    globalWithFlags[awsuiGlobalFlagsSymbol] = { oneTheme: false };
    expect(isThemeActive(Theme.OneTheme)).toBe(false);
  });
});
