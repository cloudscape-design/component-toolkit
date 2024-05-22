// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getIsRtl, getOffsetInlineStart, getLogicalBoundingClientRect, getScrollInlineStart } from '../index';

describe('getIsRtl utility function', () => {
  test('detects direction of an ltr element', () => {
    const { container } = render(<div id="test-element">Content</div>);
    expect(getIsRtl(container)).toEqual(false);
  });

  test('detects direction of an rtl element', () => {
    const { container } = render(<div id="test-element">Content</div>);
    container.style.direction = 'rtl';
    expect(getIsRtl(container)).toEqual(true);
  });

  test('detects direction of a null element', () => {
    expect(getIsRtl(null)).toEqual(false);
  });
});

describe('getOffsetInlineStart utility function', () => {
  test('computes correct offsetInlineStart of an ltr element', () => {
    const { container } = render(<div id="test-element">Content</div>);

    Object.defineProperty(container, 'offsetLeft', {
      value: 999,
    });

    expect(getOffsetInlineStart(container)).toEqual(999);
  });

  test('computes correct offsetInlineStart of an rtl element', () => {
    const { container } = render(<div id="test-element">Content</div>);
    container.style.direction = 'rtl';

    Object.defineProperty(container, 'offsetWidth', {
      value: 1000,
    });

    Object.defineProperty(container, 'offsetLeft', {
      value: 500,
    });

    expect(getOffsetInlineStart(container)).toEqual(-1500);
  });
});

describe('getScrollInlineStart utility function', () => {
  test('computes correct scrollInlineStart in ltr', () => {
    const { container } = render(<div id="test-element">Content</div>);
    container.scrollLeft = 100;
    expect(getScrollInlineStart(container)).toEqual(100);
  });

  test('computes correct scrollInlineStart in rtl', () => {
    const { container } = render(<div id="test-element">Content</div>);
    container.style.direction = 'rtl';
    container.scrollLeft = 100;
    expect(getScrollInlineStart(container)).toEqual(-100);
  });
});

/*
describe('getLogicalClientX utility function', () => {
});
*/

describe('getLogicalBoundingClientRect utility function', () => {
  test('computes correct logicalBoundingClientRect in ltr', () => {
    const { container } = render(<div id="test-element">Content</div>);

    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      bottom: 123,
      height: 456,
      left: 789,
      right: 987,
      toJSON() {
        return;
      },
      top: 321,
      width: 654,
      x: 999,
      y: 998,
    });

    expect(getLogicalBoundingClientRect(container)).toEqual({
      blockSize: 456,
      inlineSize: 654,
      insetBlockEnd: 123,
      insetBlockStart: 321,
      insetInlineEnd: 1443,
      insetInlineStart: 789,
    });
  });

  test('computes correct logicalBoundingClientRect in rtl', () => {
    const { container } = render(<div id="test-element">Content</div>);
    container.style.direction = 'rtl';

    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      bottom: 123,
      height: 456,
      left: 789,
      right: 987,
      toJSON() {
        return;
      },
      top: 321,
      width: 654,
      x: 999,
      y: 998,
    });

    expect(getLogicalBoundingClientRect(container)).toEqual({
      blockSize: 456,
      inlineSize: 654,
      insetBlockEnd: 123,
      insetBlockStart: 321,
      insetInlineEnd: -333,
      insetInlineStart: -987,
    });
  });
});

/*
describe('getLogicalPageX utility function', () => {
});
*/
