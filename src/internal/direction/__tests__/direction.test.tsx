// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import {
  getIsRtl,
  getOffsetInlineStart,
  getLogicalBoundingClientRect,
  getScrollInlineStart,
  getLogicalClientX,
  getLogicalPageX,
} from '../index';

describe('getIsRtl utility function', () => {
  test('detects direction of an ltr element', () => {
    const { container } = render(<div id="test-element">Content</div>);
    expect(getIsRtl(container.querySelector('#test-element'))).toEqual(false);
  });

  test('detects direction of an rtl element', () => {
    const { container } = render(
      <div id="test-element" style={{ direction: 'rtl' }}>
        Content
      </div>
    );
    expect(getIsRtl(container.querySelector('#test-element'))).toEqual(true);
  });

  test('detects direction of a null element', () => {
    expect(getIsRtl(null)).toEqual(false);
  });
});

describe('getOffsetInlineStart utility function', () => {
  test('computes correct offsetInlineStart of an ltr element', () => {
    const { container } = render(<div id="test-element">Content</div>);
    const element = container.querySelector('#test-element') as HTMLElement;

    Object.defineProperty(element, 'offsetLeft', {
      value: 999,
    });

    expect(getOffsetInlineStart(element)).toEqual(999);
  });

  test('computes correct offsetInlineStart of an rtl element', () => {
    const { container } = render(
      <div id="offset-parent">
        <div id="test-element" style={{ direction: 'rtl' }}>
          Content
        </div>
      </div>
    );

    const offsetParent = container.querySelector('#offset-parent') as HTMLElement;
    const element = container.querySelector('#test-element') as HTMLElement;

    Object.defineProperty(offsetParent, 'clientWidth', {
      value: 2000,
    });

    Object.defineProperty(element, 'offsetParent', {
      value: offsetParent,
    });

    Object.defineProperty(element, 'offsetWidth', {
      value: 1000,
    });

    Object.defineProperty(element, 'offsetLeft', {
      value: 500,
    });

    expect(getOffsetInlineStart(element)).toEqual(500);
  });
});

describe('getScrollInlineStart utility function', () => {
  test('computes correct scrollInlineStart in ltr', () => {
    const { container } = render(<div id="test-element">Content</div>);
    const element = container.querySelector('#test-element') as HTMLElement;
    element.scrollLeft = 100;
    expect(getScrollInlineStart(element)).toEqual(100);
  });

  test('computes correct scrollInlineStart in rtl', () => {
    const { container } = render(
      <div id="test-element" style={{ direction: 'rtl' }}>
        Content
      </div>
    );
    const element = container.querySelector('#test-element') as HTMLElement;
    element.scrollLeft = 100;
    expect(getScrollInlineStart(element)).toEqual(-100);
  });
});

describe('getLogicalClientX utility function', () => {
  test('computes correct logicalClientX in ltr', () => {
    const mouseEvent = new MouseEvent('pointermove', {}) as PointerEvent;

    Object.defineProperty(mouseEvent, 'clientX', {
      value: 1000,
    });

    expect(getLogicalClientX(mouseEvent, false)).toEqual(1000);
  });

  test('computes correct logicalClientX in rtl', () => {
    const mouseEvent = new MouseEvent('pointermove', {}) as PointerEvent;

    Object.defineProperty(mouseEvent, 'clientX', {
      value: 1000,
    });

    expect(getLogicalClientX(mouseEvent, true)).toEqual(-1000);
  });
});

describe('getLogicalBoundingClientRect utility function', () => {
  test('computes correct logicalBoundingClientRect in ltr', () => {
    const { container } = render(<div id="test-element">Content</div>);
    const element = container.querySelector('#test-element') as HTMLElement;

    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      bottom: 123,
      height: 456,
      left: 789,
      right: 987,
      toJSON() {},
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

  test('computes correct logicalBoundingClientRect in rtl', () => {
    const { container } = render(
      <div id="test-element" style={{ direction: 'rtl' }}>
        Content
      </div>
    );
    const element = container.querySelector('#test-element') as HTMLElement;

    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      bottom: 123,
      height: 456,
      left: 789,
      right: 987,
      toJSON() {},
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

describe('getLogicalPageX utility function', () => {
  test('computes correct logicalPageX in ltr', () => {
    const mouseEvent = new MouseEvent('pointermove', {});

    Object.defineProperty(mouseEvent, 'pageX', {
      value: 1000,
    });

    expect(getLogicalPageX(mouseEvent)).toEqual(1000);
  });

  test('computes correct logicalPageX in rtl', () => {
    const { container } = render(
      <div id="test-element" style={{ direction: 'rtl' }}>
        Content
      </div>
    );
    const element = container.querySelector('#test-element') as HTMLElement;

    const callback = (event: MouseEvent) => {
      Object.defineProperty(document.documentElement, 'clientWidth', {
        value: 123,
      });

      Object.defineProperty(event, 'pageX', {
        value: 1000,
      });

      expect(getLogicalPageX(event)).toEqual(-877);
    };

    element.addEventListener('click', callback);
    element.click();
  });
});
