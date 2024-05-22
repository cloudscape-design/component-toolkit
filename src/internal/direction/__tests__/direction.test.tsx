// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getIsRtl, getScrollInlineStart } from '../index';

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

/*
describe('getLogicalBoundingClientRect utility function', () => {
});
*/

/*
describe('getLogicalPageX utility function', () => {
});
*/
