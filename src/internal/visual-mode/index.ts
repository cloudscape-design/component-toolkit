// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { findUpUntil } from '../../dom/index.js';
import { createSingletonHandler } from '../singleton-handler/index.js';
import { useStableCallback } from '../stable-callback/index.js';
import { isDevelopment } from '../is-development.js';
import { warnOnce } from '../logging.js';
import { awsuiVisualRefreshFlag, getGlobal, getGlobalFlag } from '../global-flags/index.js';
import { safeMatchMedia } from '../utils/safe-match-media.js';

export function isMotionDisabled(element: HTMLElement): boolean {
  return (
    !!findUpUntil(element, node => node.classList.contains('awsui-motion-disabled')) ||
    safeMatchMedia(element, '(prefers-reduced-motion: reduce)')
  );
}

// Generic hook for detecting mode changes via DOM mutation observation.
// Prevents unnecessary re-renders by only updating state when the value actually changes.
function useModeDetector<T>(
  elementRef: React.RefObject<HTMLElement>,
  detector: (node: HTMLElement) => T,
  initialValue: T
): T {
  const [value, setValue] = useState<T>(initialValue);
  useMutationObserver(elementRef, node => {
    const newValue = detector(node);
    /**
     * React has a behavior that triggers a re-render even if the same value is provided in the setState, while it does not
     * commit any changes to the DOM (commit phase) the function rerenders. This causes a false react act warnings in testing
     * and any component using the Transition component which in return uses this hook will possibly have false react warnings.
     *
     * To fix this, we manually stop setting the state ourselves if we see the same value.
     * References:  https://www.reddit.com/r/reactjs/comments/1ej505e/why_does_it_rerender_even_when_state_is_same/#:~:text=If%20the%20new%20value%20you,shouldn't%20affect%20your%20code
     */
    if (newValue !== value) {
      setValue(newValue);
    }
  });
  return value;
}

function detectCurrentMode(node: HTMLElement): 'light' | 'dark' {
  const darkModeParent = findUpUntil(
    node,
    node => node.classList.contains('awsui-polaris-dark-mode') || node.classList.contains('awsui-dark-mode')
  );
  return darkModeParent ? 'dark' : 'light';
}

function detectDensityMode(node: HTMLElement): 'comfortable' | 'compact' {
  const compactModeParent = findUpUntil(
    node,
    node => node.classList.contains('awsui-polaris-compact-mode') || node.classList.contains('awsui-compact-mode')
  );
  return compactModeParent ? 'compact' : 'comfortable';
}

// Note that this hook doesn't take into consideration @media print (unlike the dark mode CSS),
// due to challenges with cross-browser implementations of media/print state change listeners.
// This means that components using this hook will render in dark mode even when printing.
export function useCurrentMode(elementRef: React.RefObject<HTMLElement>) {
  return useModeDetector(elementRef, detectCurrentMode, 'light');
}

export function useDensityMode(elementRef: React.RefObject<HTMLElement>) {
  return useModeDetector(elementRef, detectDensityMode, 'comfortable');
}

export function useReducedMotion(elementRef: React.RefObject<HTMLElement>) {
  return useModeDetector(elementRef, isMotionDisabled, false);
}

const useMutationSingleton = createSingletonHandler<void>(handler => {
  const observer = new MutationObserver(() => handler());
  observer.observe(document.body, { attributes: true, subtree: true });
  return () => observer.disconnect();
});

function useMutationObserver(elementRef: React.RefObject<HTMLElement>, onChange: (element: HTMLElement) => void) {
  const handler = useStableCallback(() => {
    if (elementRef.current) {
      onChange(elementRef.current);
    }
  });
  useMutationSingleton(handler);

  useEffect(() => {
    handler();
  }, [handler]);
}

export enum Theme {
  VisualRefresh = 'visual-refresh',
  OneTheme = 'one-theme',
}

// When multiple theme flags are enabled, only the highest-priority (lower index) theme's body class is applied.
const themePrecedence: Array<Theme> = [Theme.OneTheme, Theme.VisualRefresh];
interface ThemeDefinition {
  className: string;
  isFlagActive: () => boolean;
}

const themeDefinitions: Record<Theme, ThemeDefinition> = {
  [Theme.VisualRefresh]: {
    className: 'awsui-visual-refresh',
    isFlagActive: () => !!getGlobal()?.[awsuiVisualRefreshFlag]?.(),
  },
  [Theme.OneTheme]: {
    className: 'awsui-one-theme',
    isFlagActive: () => !!getGlobalFlag('oneTheme'),
  },
};

const allThemes = Object.values(Theme);

function hasThemeClassName(theme: Theme) {
  return typeof document !== 'undefined' && !!document.querySelector(`.${themeDefinitions[theme].className}`);
}

// A theme is active if its body class or its global flag is set.
export function isThemeActive(theme: Theme): boolean {
  return hasThemeClassName(theme) || themeDefinitions[theme].isFlagActive();
}

function applyThemeClassName(theme: Theme) {
  if (typeof document !== 'undefined' && !hasThemeClassName(theme) && themeDefinitions[theme].isFlagActive()) {
    document.body.classList.add(themeDefinitions[theme].className);
  }
}

export function initThemes() {
  const flaggedThemes = themePrecedence.filter(theme => themeDefinitions[theme].isFlagActive());
  if (isDevelopment && flaggedThemes.length > 1) {
    warnOnce(
      'Theme',
      `Multiple theme flags are enabled (${flaggedThemes.join(', ')}). ` +
        `Only the highest-priority theme (${flaggedThemes[0]}) is applied.`
    );
  }
  if (flaggedThemes.length > 0) {
    applyThemeClassName(flaggedThemes[0]);
  }
}

let runtimeVisualRefresh: undefined | boolean = undefined;

// Resets applied theme state: removes every theme's body class and clears the memoized state.
export function clearThemeState() {
  runtimeVisualRefresh = undefined;
  if (typeof document !== 'undefined') {
    for (const theme of allThemes) {
      document.body.classList.remove(themeDefinitions[theme].className);
    }
  }
}

// @deprecated Use `clearThemeState` instead.
export function clearVisualRefreshState() {
  clearThemeState();
}

export function useRuntimeVisualRefresh() {
  if (runtimeVisualRefresh === undefined) {
    initThemes();
    // One Theme needs to activate the same visual refresh behavior as the
    // Visual Refresh theme, so both themes count as visual refresh here.
    runtimeVisualRefresh = isThemeActive(Theme.VisualRefresh) || isThemeActive(Theme.OneTheme);
  }
  if (isDevelopment) {
    const visualRefreshActive = isThemeActive(Theme.VisualRefresh) || isThemeActive(Theme.OneTheme);
    if (visualRefreshActive !== runtimeVisualRefresh) {
      warnOnce(
        'Visual Refresh',
        'Dynamic theme change detected. This is not supported. ' +
          'Make sure the theme class (e.g. `awsui-visual-refresh` or `awsui-one-theme`) is attached to ' +
          'the `<body>` element before the initial React render.'
      );
    }
  }
  return runtimeVisualRefresh;
}
