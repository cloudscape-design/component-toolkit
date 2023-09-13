// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { findUpUntil } from '../../dom';
import { createSingletonHandler } from '../singleton-handler';
import { useStableCallback } from '../stable-callback';
import { isDevelopment } from '../is-development';
import { warnOnce } from '../logging';

const awsuiVisualRefreshFlag = Symbol.for('awsui-visual-refresh-flag');
interface ExtendedWindow extends Window {
  [awsuiVisualRefreshFlag]?: () => boolean;
}
declare const window: ExtendedWindow;

export function isMotionDisabled(element: HTMLElement): boolean {
  return (
    !!findUpUntil(element, node => node.classList.contains('awsui-motion-disabled')) ||
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  );
}

// Note that this hook doesn't take into consideration @media print (unlike the dark mode CSS),
// due to challenges with cross-browser implementations of media/print state change listeners.
// This means that components using this hook will render in dark mode even when printing.
export function useCurrentMode(elementRef: React.RefObject<HTMLElement>) {
  const [value, setValue] = useState<'light' | 'dark'>('light');
  useMutationObserver(elementRef, node => {
    const darkModeParent = findUpUntil(
      node,
      node => node.classList.contains('awsui-polaris-dark-mode') || node.classList.contains('awsui-dark-mode')
    );
    setValue(darkModeParent ? 'dark' : 'light');
  });
  return value;
}

export function useDensityMode(elementRef: React.RefObject<HTMLElement>) {
  const [value, setValue] = useState<'comfortable' | 'compact'>('comfortable');
  useMutationObserver(elementRef, node => {
    const compactModeParent = findUpUntil(
      node,
      node => node.classList.contains('awsui-polaris-compact-mode') || node.classList.contains('awsui-compact-mode')
    );
    setValue(compactModeParent ? 'compact' : 'comfortable');
  });
  return value;
}

export function useReducedMotion(elementRef: React.RefObject<HTMLElement>) {
  const [value, setValue] = useState(false);
  useMutationObserver(elementRef, node => {
    setValue(isMotionDisabled(node));
  });
  return value;
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
}

function detectVisualRefresh() {
  return typeof document !== 'undefined' && !!document.querySelector('.awsui-visual-refresh');
}

export function useRuntimeVisualRefresh() {
  if (visualRefreshState === undefined) {
    visualRefreshState = detectVisualRefresh();
    if (!visualRefreshState && typeof window !== 'undefined' && window[awsuiVisualRefreshFlag]?.()) {
      document.body.classList.add('awsui-visual-refresh');
      visualRefreshState = true;
    }
  }
  if (isDevelopment) {
    const newVisualRefreshState = detectVisualRefresh();
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
