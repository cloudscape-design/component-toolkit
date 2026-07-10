// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';

// eslint-disable-next-line import/extensions
import { useMobile } from '../index';
import * as safeMatchMediaModule from '../../utils/safe-match-media';

function Demo() {
  const renderCount = useRef(0);
  const isMobile = useMobile();
  renderCount.current++;
  return (
    <div>
      <span data-testid="mobile">{String(isMobile)}</span>
      <span data-testid="render-count">{renderCount.current}</span>
    </div>
  );
}

function resizeWindow(width: number) {
  act(() => {
    // Mock safeMatchMedia to return the result of a passed-in `max-width` query based on the width the window wasjust resized to
    jest.spyOn(safeMatchMediaModule, 'safeMatchMedia').mockImplementation((element, query) => {
      // Extract the max-width value from the query
      const match = query.match(/max-width:\s*(\d+)px/);
      const maxWidth = match ? parseInt(match[1], 10) : Infinity;
      return width <= maxWidth;
    });

    window.dispatchEvent(new CustomEvent('resize'));
  });
}

test('should report mobile width on the initial render', () => {
  resizeWindow(400);
  const { getByTestId } = render(<Demo />);
  expect(getByTestId('mobile').textContent).toBe('true');
});

test('should report desktop width on the initial render', () => {
  resizeWindow(1200);
  const { getByTestId } = render(<Demo />);
  expect(getByTestId('mobile').textContent).toBe('false');
});

test('should report the updated value after resize', () => {
  resizeWindow(400);
  const { getByTestId } = render(<Demo />);
  const countBefore = getByTestId('render-count').textContent;
  resizeWindow(1200);
  const countAfter = getByTestId('render-count').textContent;
  expect(getByTestId('mobile').textContent).toBe('false');
  expect(countBefore).not.toEqual(countAfter);
});

test('no renders when resize does not hit the breakpoint', () => {
  resizeWindow(1000);
  const { getByTestId } = render(<Demo />);
  const countBefore = getByTestId('render-count').textContent;
  resizeWindow(1200);
  const countAfter = getByTestId('render-count').textContent;
  expect(countBefore).toEqual(countAfter);
});
