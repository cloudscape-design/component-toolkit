// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { findUpUntil } from '../../dom';
import { createSingletonHandler } from '../singleton-handler';
import { useStableCallback } from '../stable-callback';
import { isDevelopment } from '../is-development';
import { warnOnce } from '../logging';
import { awsuiVisualRefreshFlag, getGlobal } from '../global-flags';

function safeMatchMedia(element: HTMLElement, query: string) {
  try {
    const targetWindow = element.ownerDocument?.defaultView ?? window;
    return targetWindow.matchMedia?.(query).matches ?? false;
  } catch (error) {
    console.warn(error);
    return false;
  }
}

export function isMotionDisabled(element: HTMLElement): boolean {
  return (
    !!findUpUntil(element, node => node.classList.contains('awsui-motion-disabled')) ||
    safeMatchMedia(element, '(prefers-reduced-motion: reduce)')
  );
}

// Note that this hook doesn't take into consideration @media print (unlike the dark mode CSS),
// due to challenges with cross-browser implementations of media/print state change listeners.
// This means that components using this hook will render in dark mode even when printing.
// Generic hook for detecting visual mode changes via DOM mutation observation.
// Prevents unnecessary re-renders by only updating state when the value actually changes.
function useVisualModeDetector<T>(
  elementRef: React.RefObject<HTMLElement>,
  detector: (node: HTMLElement) => T,
  initialValue: T
): T {
  const [value, setValue] = useState<T>(initialValue);
  useMutationObserver(elementRef, node => {
    const newValue = detector(node);
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
  return useVisualModeDetector(elementRef, detectCurrentMode, 'light');
}

export function useDensityMode(elementRef: React.RefObject<HTMLElement>) {
  return useVisualModeDetector(elementRef, detectDensityMode, 'comfortable');
}

export function useReducedMotion(elementRef: React.RefObject<HTMLElement>) {
  return useVisualModeDetector(elementRef, isMotionDisabled, false);
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

// We expect VR is to be set only once and before the application is rendered.
let visualRefreshState: undefined | boolean = undefined;

// for testing
export function clearVisualRefreshState() {
  visualRefreshState = undefined;
  if (typeof document !== 'undefined') {
    document.body.classList.remove('awsui-visual-refresh');
  }
}

function detectVisualRefreshClassName() {
  return typeof document !== 'undefined' && !!document.querySelector('.awsui-visual-refresh');
}

function detectVisualRefreshFlag() {
  const global = getGlobal();
  return global?.[awsuiVisualRefreshFlag]?.() ?? false;
}

export function useRuntimeVisualRefresh() {
  if (visualRefreshState === undefined) {
    visualRefreshState = detectVisualRefreshClassName();
    if (!visualRefreshState) {
      if (detectVisualRefreshFlag()) {
        visualRefreshState = true;
        if (typeof document !== 'undefined') {
          document.body.classList.add('awsui-visual-refresh');
        }
      }
    }
  }
  if (isDevelopment) {
    const newVisualRefreshState = detectVisualRefreshClassName() || detectVisualRefreshFlag();
    if (newVisualRefreshState !== visualRefreshState) {
      warnOnce(
        'Visual Refresh',
        'Dynamic visual refresh change detected. This is not supported. ' +
          'Make sure `awsui-visual-refresh` is attached to the `<body>` element before initial React render'
      );
    }
  }
  return visualRefreshState;
}
