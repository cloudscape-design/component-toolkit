// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getIsRtl, getLogicalBoundingClientRect, getScrollInlineStart } from '../index';

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

/*
describe('getOffsetInlineStart utility function', () => {
});
*/

describe('getScrollInlineStart utility function', () => {
  test('computes correct scrollInlineStart in ltr', () => {
    const { container } = render(
      <div id="container" style={{ width: '100px', overflowX: 'scroll' }}>
        <div id="content" style={{ width: '400px' }}>
          This is really really really really really really really really really really long content.
        </div>
      </div>
    );

    const element = container.querySelector('#content') as HTMLElement;
    element.scrollLeft = 100;
    expect(getScrollInlineStart(element)).toEqual(100);
  });

  test('computes correct scrollInlineStart in rtl', () => {
    const { container } = render(
      <div id="container" style={{ width: '100px', overflowX: 'scroll' }}>
        <div id="content" style={{ width: '400px' }}>
          This is really really really really really really really really really really long content.
        </div>
      </div>
    );

    const element = container.querySelector('#content') as HTMLElement;
    element.style.direction = 'rtl';
    element.scrollLeft = 100;
    expect(getScrollInlineStart(element)).toEqual(-100);
  });
});

/*
describe('getLogicalClientX utility function', () => {
});
*/

describe('getLogicalBoundingClientRect utility function', () => {
  test('computes correct logical bounding client rect in ltr', () => {
    const { container } = render(
      <div id="container" style={{ width: '100px', overflowX: 'scroll' }}>
        <div id="content" style={{ width: '400px' }}>
          This is really really really really really really really really really really long content.
        </div>
      </div>
    );

    const element = container.querySelector('#content') as HTMLElement;

    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
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

    expect(getLogicalBoundingClientRect(element)).toEqual({
      blockSize: 456,
      inlineSize: 654,
      insetBlockEnd: 123,
      insetBlockStart: 321,
      insetInlineEnd: 1443,
      insetInlineStart: 789,
    });
  });

  test('computes correct logical bounding client rect in rtl', () => {
    const { container } = render(
      <div id="container" style={{ width: '100px', overflowX: 'scroll' }}>
        <div id="content" style={{ width: '400px' }}>
          This is really really really really really really really really really really long content.
        </div>
      </div>
    );

    const element = container.querySelector('#content') as HTMLElement;
    element.style.direction = 'rtl';

    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
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

    expect(getLogicalBoundingClientRect(element)).toEqual({
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
