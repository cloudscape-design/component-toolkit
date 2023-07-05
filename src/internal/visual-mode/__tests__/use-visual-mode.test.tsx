// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useRef } from 'react';
import { useCurrentMode, useDensityMode, isMotionDisabled, useReducedMotion } from '../index';
import { render, screen } from '@testing-library/react';
import { mutate } from './utils';

describe('useCurrentMode', () => {
  function ModeRender() {
    const ref = useRef(null);
    const mode = useCurrentMode(ref);
    return (
      <div ref={ref} data-testid="current-mode">
        {mode}
      </div>
    );
  }

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {
      /*do not print anything to browser logs*/
    });
  });

  afterEach(() => {
    // ensure there are no react warnings
    expect(console.error).not.toHaveBeenCalled();
  });

  test('should detect light mode by default', () => {
    render(<ModeRender />);
    expect(screen.getByTestId('current-mode')).toHaveTextContent('light');
  });

  test('should detect dark mode', () => {
    render(
      <div className="awsui-polaris-dark-mode">
        <ModeRender />
      </div>
    );
    expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
  });

  test('should detect alternative dark mode class name', () => {
    render(
      <div className="awsui-dark-mode">
        <ModeRender />
      </div>
    );
    expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
  });

  test('should detect mode switch both ways', async () => {
    const { container } = render(<ModeRender />);
    expect(screen.getByTestId('current-mode')).toHaveTextContent('light');
    await mutate(() => container.classList.add('awsui-dark-mode'));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
    await mutate(() => container.classList.remove('awsui-dark-mode'));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('light');
  });

  test('should unmount properly', async () => {
    const { rerender, container } = render(<ModeRender />);
    rerender(<>empty content</>);
    await mutate(() => container.classList.add('awsui-dark-mode'));
  });
});

// The above suites cover majority of cases
describe('useDensityMode', () => {
  function ModeRender() {
    const ref = useRef(null);
    const mode = useDensityMode(ref);
    return (
      <div ref={ref} data-testid="current-mode">
        {mode}
      </div>
    );
  }

  test('should detect density modes', async () => {
    const { container } = render(<ModeRender />);

    // Default
    expect(screen.getByTestId('current-mode')).toHaveTextContent('comfortable');

    // External class
    await mutate(() => container.classList.add('awsui-compact-mode'));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('compact');
    await mutate(() => container.classList.remove('awsui-compact-mode'));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('comfortable');

    // Internal class
    await mutate(() => container.classList.add('awsui-polaris-compact-mode'));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('compact');
    await mutate(() => container.classList.remove('awsui-polaris-compact-mode'));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('comfortable');
  });
});

describe('isMotionDisabled', () => {
  const originalMatchMedia = window.matchMedia;
  let matchedMediaExpression = '';

  beforeEach(() => {
    matchedMediaExpression = '';
    window.matchMedia = (expression: string) => {
      if (expression === matchedMediaExpression) {
        return { matches: true } as MediaQueryList;
      }
      return { matches: false } as MediaQueryList;
    };
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test('returns true if "awsui-motion-disabled" class is set', () => {
    render(
      <div className="awsui-motion-disabled">
        <div data-testid="target"></div>
      </div>
    );
    expect(isMotionDisabled(screen.getByTestId('target'))).toBe(true);
  });

  test('returns true if media (prefers-reduced-motion: reduce) is set', () => {
    matchedMediaExpression = '(prefers-reduced-motion: reduce)';
    render(
      <div>
        <div data-testid="target"></div>
      </div>
    );
    expect(isMotionDisabled(screen.getByTestId('target'))).toBe(true);
  });

  test('returns false if no class or media set', () => {
    render(
      <div>
        <div data-testid="target"></div>
      </div>
    );
    expect(isMotionDisabled(screen.getByTestId('target'))).toBe(false);
  });
});

describe('useReducedMotion', () => {
  function ModeRender() {
    const ref = useRef(null);
    const isReduced = useReducedMotion(ref);
    return (
      <div ref={ref} data-testid="target">
        {isReduced ? 'reduced' : 'full'}
      </div>
    );
  }

  test('should detect motion modes', async () => {
    const { container } = render(<ModeRender />);

    expect(screen.getByTestId('target')).toHaveTextContent('full');

    await mutate(() => container.classList.add('awsui-motion-disabled'));
    expect(screen.getByTestId('target')).toHaveTextContent('reduced');
    await mutate(() => container.classList.remove('awsui-motion-disabled'));
    expect(screen.getByTestId('target')).toHaveTextContent('full');
  });
});
