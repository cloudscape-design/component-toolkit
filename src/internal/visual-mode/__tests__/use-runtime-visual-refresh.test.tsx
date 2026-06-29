// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { useRuntimeVisualRefresh, clearThemeState, initThemes } from '../index';
import { render, screen } from '@testing-library/react';
import { clearMessageCache } from '../../logging';

const awsuiVisualRefreshFlag = Symbol.for('awsui-visual-refresh-flag');
const awsuiGlobalFlagsSymbol = Symbol.for('awsui-global-flags');
interface ExtendedWindow extends Window {
  [awsuiVisualRefreshFlag]?: () => boolean;
}
declare const window: ExtendedWindow;

describe('useVisualRefresh', () => {
  function App() {
    const isRefresh = useRuntimeVisualRefresh();
    return <div data-testid="current-mode">{isRefresh.toString()}</div>;
  }

  afterEach(() => {
    clearThemeState();
    expect(document.querySelector('.awsui-visual-refresh')).toBeFalsy();
    expect(document.querySelector('.awsui-one-theme')).toBeFalsy();
  });
  afterEach(() => {
    clearMessageCache();
    jest.restoreAllMocks();
  });

  test('should return false when class name is not present', () => {
    render(<App />);
    expect(screen.getByTestId('current-mode')).toHaveTextContent('false');
  });

  test('should return true when class name is present', () => {
    document.body.classList.add('awsui-visual-refresh');
    render(<App />);
    expect(screen.getByTestId('current-mode')).toHaveTextContent('true');
  });

  test('should return true when awsui-one-theme class name is present', () => {
    document.body.classList.add('awsui-one-theme');
    render(<App />);
    expect(screen.getByTestId('current-mode')).toHaveTextContent('true');
  });

  test('should print a warning when late visual refresh class name was detected', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<App />);
    expect(screen.getByTestId('current-mode')).toHaveTextContent('false');
    expect(console.warn).not.toHaveBeenCalled();

    document.body.classList.add('awsui-visual-refresh');
    rerender(<App />);
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/Dynamic theme change detected/));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('false');
  });

  describe('Window Symbol awsui-visual-refresh-flag', () => {
    afterEach(() => {
      window[awsuiVisualRefreshFlag] = undefined;
    });

    test('should return true when Window Symbol awsui-visual-refresh-flag returns true', () => {
      window[awsuiVisualRefreshFlag] = () => true;
      render(<App />);
      expect(screen.getByTestId('current-mode')).toHaveTextContent('true');
    });

    test('should return false when Window Symbol awsui-visual-refresh-flag returns false', () => {
      window[awsuiVisualRefreshFlag] = () => false;
      render(<App />);
      expect(screen.getByTestId('current-mode')).toHaveTextContent('false');
    });

    test('should not change theme when Window Symbol awsui-visual-refresh-flag is set later', () => {
      const { rerender } = render(<App />);
      expect(screen.getByTestId('current-mode')).toHaveTextContent('false');

      window[awsuiVisualRefreshFlag] = () => true;
      rerender(<App />);
      expect(screen.getByTestId('current-mode')).toHaveTextContent('false');
    });

    test('should return true when Window Symbol awsui-visual-refresh-flag returns false but class name is present', () => {
      document.body.classList.add('awsui-visual-refresh');
      window[awsuiVisualRefreshFlag] = () => false;
      render(<App />);
      expect(screen.getByTestId('current-mode')).toHaveTextContent('true');
    });
  });

  describe('oneTheme global flag', () => {
    afterEach(() => {
      delete (window as any)[awsuiGlobalFlagsSymbol];
    });

    test('should return true when oneTheme global flag is set', () => {
      (window as any)[awsuiGlobalFlagsSymbol] = { oneTheme: true };
      render(<App />);
      expect(screen.getByTestId('current-mode')).toHaveTextContent('true');
    });

    test('should add the awsui-one-theme body class when oneTheme global flag is set', () => {
      (window as any)[awsuiGlobalFlagsSymbol] = { oneTheme: true };
      render(<App />);
      expect(document.body).toHaveClass('awsui-one-theme');
    });

    test('should not add the awsui-one-theme body class when oneTheme global flag is not set', () => {
      window[awsuiVisualRefreshFlag] = () => true;
      render(<App />);
      expect(document.body).toHaveClass('awsui-visual-refresh');
      expect(document.body).not.toHaveClass('awsui-one-theme');
      window[awsuiVisualRefreshFlag] = undefined;
    });
  });

  describe('initThemes', () => {
    afterEach(() => {
      delete (window as any)[awsuiGlobalFlagsSymbol];
      window[awsuiVisualRefreshFlag] = undefined;
    });

    test('adds the visual refresh body class when its flag is set', () => {
      window[awsuiVisualRefreshFlag] = () => true;
      initThemes();
      expect(document.body).toHaveClass('awsui-visual-refresh');
      expect(document.body).not.toHaveClass('awsui-one-theme');
    });

    test('adds the one-theme body class when its flag is set', () => {
      (window as any)[awsuiGlobalFlagsSymbol] = { oneTheme: true };
      initThemes();
      expect(document.body).toHaveClass('awsui-one-theme');
    });

    test('adds no theme body class when no flag is set', () => {
      initThemes();
      expect(document.body).not.toHaveClass('awsui-visual-refresh');
      expect(document.body).not.toHaveClass('awsui-one-theme');
    });

    test('applies only the highest-priority theme when multiple flags are set', () => {
      window[awsuiVisualRefreshFlag] = () => true;
      (window as any)[awsuiGlobalFlagsSymbol] = { oneTheme: true };
      initThemes();
      expect(document.body).toHaveClass('awsui-one-theme');
      expect(document.body).not.toHaveClass('awsui-visual-refresh');
    });

    test('warns when multiple theme flags are enabled', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      window[awsuiVisualRefreshFlag] = () => true;
      (window as any)[awsuiGlobalFlagsSymbol] = { oneTheme: true };
      initThemes();
      expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/Multiple theme flags are enabled/));
    });
  });
});
