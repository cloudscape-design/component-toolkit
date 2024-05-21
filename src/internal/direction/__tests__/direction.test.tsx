// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getIsRtl } from '../index';

describe('getIsRtl utility function', () => {
  test('detects an element direction is ltr', () => {
    const renderResult = render(
      <div dir="ltr">
        <div id="test-element">Content</div>
      </div>
    );

    const element = renderResult.container.querySelector('#test-element') as HTMLElement;
    expect(getIsRtl(element)).toEqual(false);
  });

  test('detects an element direction is rtl', () => {
    const renderResult = render(
      <div dir="rtl">
        <div id="test-element">Content</div>
      </div>
    );

    const element = renderResult.container.querySelector('#test-element') as HTMLElement;
    expect(getIsRtl(element)).toEqual(true);
  });
});
