// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { isMotionDisabled } from '../index';

const matchMedia = jest.fn();
window.matchMedia = matchMedia;

beforeEach(() => {
  matchMedia.mockReturnValue({ matches: false });
});

describe('isMotionDisabled', () => {
  test('returns false when there is no awsui-motion-disabled class', () => {
    const renderResult = render(
      <div>
        <div id="test-element">Content</div>
      </div>
    );
    const element = renderResult.container.querySelector('#test-element') as HTMLElement;
    expect(isMotionDisabled(element)).toEqual(false);
  });
  test('returns true when a parent element has awsui-motion-disabled class', () => {
    const renderResult = render(
      <div className="awsui-motion-disabled">
        <div>
          <div>
            <div>
              <div>
                <div id="test-element">Content</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    const element = renderResult.container.querySelector('#test-element') as HTMLElement;
    expect(isMotionDisabled(element)).toEqual(true);
  });
  test('returns false when there is an element with class awsui-motion-disabled, but it is not in the hierarchy', () => {
    const renderResult = render(
      <div>
        <div className="awsui-motion-disabled">Content</div>
        <div id="test-element">Content</div>
      </div>
    );
    const element = renderResult.container.querySelector('#test-element') as HTMLElement;
    expect(isMotionDisabled(element)).toEqual(false);
  });
  test('returns true with prefers-reduced-motion: reduce ', () => {
    matchMedia.mockReturnValue({ matches: true });
    const renderResult = render(
      <div>
        <div id="test-element">Content</div>
      </div>
    );
    const element = renderResult.container.querySelector('#test-element') as HTMLElement;
    expect(isMotionDisabled(element)).toEqual(true);
  });
  test('returns true with prefers-reduced-motion: reduce and class awsui-motion-disabled', () => {
    matchMedia.mockReturnValue({ matches: true });
    const renderResult = render(
      <div className="awsui-motion-disabled">
        <div id="test-element">Content</div>
      </div>
    );
    const element = renderResult.container.querySelector('#test-element') as HTMLElement;
    expect(isMotionDisabled(element)).toEqual(true);
  });

  test('should default to false when an error is thrown and a warning is logged', () => {
    matchMedia.mockReturnValue(null);

    const warnSpy = jest.spyOn(console, 'warn');

    const renderResult = render(
      <div>
        <div id="test-element">Content</div>
      </div>
    );
    const element = renderResult.container.querySelector('#test-element') as HTMLElement;

    expect(isMotionDisabled(element)).toEqual(false);

    expect(warnSpy).toHaveBeenCalled();
  });
});
