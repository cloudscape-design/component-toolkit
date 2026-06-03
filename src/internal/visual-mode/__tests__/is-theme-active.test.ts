// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { isThemeActive, Theme } from '../index';
import { awsuiGlobalFlagsSymbol, awsuiVisualRefreshFlag, FlagsHolder } from '../../global-flags';

declare const window: Window & FlagsHolder;

afterEach(() => {
  document.body.classList.remove('awsui-visual-refresh');
  document.body.classList.remove('awsui-one-theme');
  delete window[awsuiVisualRefreshFlag];
  delete window[awsuiGlobalFlagsSymbol];
});

describe('Theme.VisualRefresh', () => {
  test('returns false when nothing is set', () => {
    expect(isThemeActive(Theme.VisualRefresh)).toBe(false);
  });

  test('returns true when the awsui-visual-refresh class is present', () => {
    document.body.classList.add('awsui-visual-refresh');
    expect(isThemeActive(Theme.VisualRefresh)).toBe(true);
  });

  test('returns true when awsui-visual-refresh-flag returns true', () => {
    window[awsuiVisualRefreshFlag] = () => true;
    expect(isThemeActive(Theme.VisualRefresh)).toBe(true);
  });

  test('returns false when awsui-visual-refresh-flag returns false', () => {
    window[awsuiVisualRefreshFlag] = () => false;
    expect(isThemeActive(Theme.VisualRefresh)).toBe(false);
  });

  test('class presence wins over a flag returning false', () => {
    document.body.classList.add('awsui-visual-refresh');
    window[awsuiVisualRefreshFlag] = () => false;
    expect(isThemeActive(Theme.VisualRefresh)).toBe(true);
  });
});

describe('Theme.OneTheme', () => {
  test('returns false when nothing is set', () => {
    expect(isThemeActive(Theme.OneTheme)).toBe(false);
  });

  test('returns true when the awsui-one-theme class is present', () => {
    document.body.classList.add('awsui-one-theme');
    expect(isThemeActive(Theme.OneTheme)).toBe(true);
  });

  test('returns true when the oneTheme global flag is true', () => {
    window[awsuiGlobalFlagsSymbol] = { oneTheme: true };
    expect(isThemeActive(Theme.OneTheme)).toBe(true);
  });

  test('returns false when the oneTheme global flag is false', () => {
    window[awsuiGlobalFlagsSymbol] = { oneTheme: false };
    expect(isThemeActive(Theme.OneTheme)).toBe(false);
  });

  test('returns false when awsui-global-flags exists but oneTheme is unset', () => {
    window[awsuiGlobalFlagsSymbol] = {};
    expect(isThemeActive(Theme.OneTheme)).toBe(false);
  });

  test('class presence wins over a flag set to false', () => {
    document.body.classList.add('awsui-one-theme');
    window[awsuiGlobalFlagsSymbol] = { oneTheme: false };
    expect(isThemeActive(Theme.OneTheme)).toBe(true);
  });
});

describe('theme isolation', () => {
  test('activating one theme via class does not activate visual refresh', () => {
    document.body.classList.add('awsui-one-theme');
    expect(isThemeActive(Theme.VisualRefresh)).toBe(false);
    expect(isThemeActive(Theme.OneTheme)).toBe(true);
  });

  test('activating visual refresh via class does not activate one theme', () => {
    document.body.classList.add('awsui-visual-refresh');
    expect(isThemeActive(Theme.VisualRefresh)).toBe(true);
    expect(isThemeActive(Theme.OneTheme)).toBe(false);
  });

  test('activating one theme via flag does not activate visual refresh', () => {
    window[awsuiGlobalFlagsSymbol] = { oneTheme: true };
    expect(isThemeActive(Theme.VisualRefresh)).toBe(false);
    expect(isThemeActive(Theme.OneTheme)).toBe(true);
  });

  test('activating visual refresh via symbol does not activate one theme', () => {
    window[awsuiVisualRefreshFlag] = () => true;
    expect(isThemeActive(Theme.VisualRefresh)).toBe(true);
    expect(isThemeActive(Theme.OneTheme)).toBe(false);
  });
});
