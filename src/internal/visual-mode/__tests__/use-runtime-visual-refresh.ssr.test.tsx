/**
 * @jest-environment node
 */
/* eslint-disable header/header */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { useRuntimeVisualRefresh, clearVisualRefreshState } from '../index';
import { clearMessageCache } from '../../logging';
import { renderToStaticMarkup } from 'react-dom/server';
import { awsuiVisualRefreshFlag, FlagsHolder } from '../../global-flags/index.js';

const globalWithFlags = globalThis as FlagsHolder;

function App() {
  const isRefresh = useRuntimeVisualRefresh();
  return <div data-testid="current-mode">{isRefresh.toString()}</div>;
}

afterEach(() => {
  delete globalWithFlags[awsuiVisualRefreshFlag];
  jest.restoreAllMocks();
  clearVisualRefreshState();
  clearMessageCache();
});

test('resolves to classic by default', () => {
  const content = renderToStaticMarkup(<App />);
  expect(content).toEqual('<div data-testid="current-mode">false</div>');
});

test('supports setting visual refresh flag via globalThis', () => {
  globalWithFlags[awsuiVisualRefreshFlag] = () => true;
  const content = renderToStaticMarkup(<App />);
  expect(content).toEqual('<div data-testid="current-mode">true</div>');
});

test('prints a warning when feature flag changes between renders', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  globalWithFlags[awsuiVisualRefreshFlag] = () => true;
  renderToStaticMarkup(<App />);
  globalWithFlags[awsuiVisualRefreshFlag] = () => false;
  renderToStaticMarkup(<App />);
  expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/Dynamic visual refresh change detected/));
});
