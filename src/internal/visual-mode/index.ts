// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';
import { findUpUntil } from '../../dom/index.js';
import { isHTMLElement } from '../../dom/element-types.js';
import { createSingletonHandler } from '../singleton-handler/index.js';
import { useStableCallback } from '../stable-callback/index.js';
import { isDevelopment } from '../is-development.js';
import { warnOnce } from '../logging.js';
import { awsuiVisualRefreshFlag, getGlobal, getGlobalFlag } from '../global-flags/index.js';
import { safeMatchMedia } from '../utils/safe-match-media.js';

/**
 * Ancestor-chain lookups resolved during the current mutation flush, keyed by mode and then
 * by element. Only populated while the singleton observer is fanning out to its subscribers
 * (see `useMutationSingleton`), and `null` at all other times.
 *
 * Only the detectors below read it. Callers outside the fan-out must not, because React can
 * run effects while it is populated: an effect that mutates a mode class and then queries
 * synchronously has to see the DOM as it is, not as the flush found it. The detectors
 * themselves are unaffected, since they all run before any effect in the batch and any
 * mutation an effect makes schedules a fresh flush.
 */
let flushCache: null | Map<string, Map<HTMLElement, boolean>> = null;

function getParentHTMLElement(element: HTMLElement): HTMLElement | null {
  let parent: HTMLElement | null = element.parentElement;
  // If a component is used within an svg (i.e. as foreignObject), then it will have some
  // ancestor nodes that are SVGElement. We want to skip those, as they have very different
  // properties to HTMLElements.
  while (parent && !isHTMLElement(parent)) {
    parent = (parent as Element).parentElement;
  }
  return parent;
}

/**
 * Whether `element` or any of its ancestors satisfies `test`.
 *
 * Within a mutation flush every element on the traversed path is memoized, so subscribers
 * that share ancestors resolve in constant time instead of each re-walking to the document
 * root. Pages with many mode detectors mounted (for example a table with a popover in every
 * cell) are dominated by those redundant walks: cost per flush goes from
 * O(subscribers x depth) to O(distinct paths).
 */
function hasMatchingAncestor(mode: string, element: HTMLElement, test: (node: HTMLElement) => boolean): boolean {
  if (!flushCache) {
    return !!findUpUntil(element, test);
  }
  let cache = flushCache.get(mode);
  if (!cache) {
    cache = new Map();
    flushCache.set(mode, cache);
  }

  const path: Array<HTMLElement> = [];
  let current: HTMLElement | null = element;
  let result: boolean | undefined = undefined;

  while (current) {
    const cached = cache.get(current);
    if (cached !== undefined) {
      result = cached;
      break;
    }
    path.push(current);
    if (test(current)) {
      result = true;
      break;
    }
    current = getParentHTMLElement(current);
  }

  const resolved = result ?? false;
  for (const visited of path) {
    cache.set(visited, resolved);
  }
  return resolved;
}

function hasMotionDisabledAncestor(element: HTMLElement): boolean {
  return !!findUpUntil(element, node => node.classList.contains('awsui-motion-disabled'));
}

// Public API, callable at any time, so it always reads the live DOM rather than the flush cache.
export function isMotionDisabled(element: HTMLElement): boolean {
  return hasMotionDisabledAncestor(element) || safeMatchMedia(element, '(prefers-reduced-motion: reduce)');
}

// Equivalent to `isMotionDisabled`, but shares ancestor lookups across subscribers in a flush.
function detectReducedMotion(element: HTMLElement): boolean {
  return (
    hasMatchingAncestor('motion', element, node => node.classList.contains('awsui-motion-disabled')) ||
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
  const isDark = hasMatchingAncestor(
    'dark',
    node,
    node => node.classList.contains('awsui-polaris-dark-mode') || node.classList.contains('awsui-dark-mode')
  );
  return isDark ? 'dark' : 'light';
}

function detectDensityMode(node: HTMLElement): 'comfortable' | 'compact' {
  const isCompact = hasMatchingAncestor(
    'compact',
    node,
    node => node.classList.contains('awsui-polaris-compact-mode') || node.classList.contains('awsui-compact-mode')
  );
  return isCompact ? 'compact' : 'comfortable';
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
  return useModeDetector(elementRef, detectReducedMotion, false);
}

/**
 * How many subscribers each ref backs. Counted rather than a set, because the hooks take a
 * ref instead of owning one, so a component may detect one mode on an element and pass the
 * same ref to a child that detects another. Unmounting one of those must not discard the
 * bookkeeping the other still relies on.
 */
const subscriberCountsByRef = new Map<React.RefObject<HTMLElement>, number>();

/**
 * Every node on some subscriber's ancestor chain, including the subscribed elements
 * themselves, with a count of how many chains pass through each.
 *
 * This is what makes the `childList` filter cheap. A `childList` change can only alter a mode
 * if a subscriber sits at or below one of the moved nodes, which is true exactly when a moved
 * node is on some subscriber's chain. Testing that costs one map lookup per moved node, where
 * walking every subscriber's chain per mutation would cost O(subscribers x depth) — and
 * unrelated churn, which is most of what `childList` reports, is all worst case for such a
 * walk, since it can only conclude "no subscriber moved" after walking all of them.
 *
 * Counting, rather than a plain set, is what lets a subscriber be added to an existing map:
 * detectors on one page share most of their chain, so the shared nodes must survive until the
 * last chain through them is gone.
 */
const chainNodeCounts = new Map<Node, number>();

/**
 * Whether `chainNodeCounts` still describes the live DOM. It is derived from ancestor chains,
 * so anything that reshapes one invalidates it. Rebuilding is deferred to the next read, so a
 * burst of mutations costs one rebuild rather than one per mutation.
 */
let chainsNeedRebuild = false;

function addChain(elementRef: React.RefObject<HTMLElement>) {
  for (let node: Node | null = elementRef.current; node; node = node.parentNode) {
    chainNodeCounts.set(node, (chainNodeCounts.get(node) ?? 0) + 1);
  }
}

function rebuildChains() {
  chainNodeCounts.clear();
  for (const [ref, subscriberCount] of subscriberCountsByRef) {
    for (let i = 0; i < subscriberCount; i++) {
      addChain(ref);
    }
  }
  chainsNeedRebuild = false;
}

function subscribeChain(elementRef: React.RefObject<HTMLElement>) {
  subscriberCountsByRef.set(elementRef, (subscriberCountsByRef.get(elementRef) ?? 0) + 1);
  if (!chainsNeedRebuild) {
    addChain(elementRef);
  }
}

function unsubscribeChain(elementRef: React.RefObject<HTMLElement>) {
  const remaining = (subscriberCountsByRef.get(elementRef) ?? 1) - 1;
  if (remaining > 0) {
    subscriberCountsByRef.set(elementRef, remaining);
  } else {
    subscriberCountsByRef.delete(elementRef);
  }
  // The chain is not unwound incrementally: by cleanup time the element may already have been
  // detached or moved, so the chain walked here need not be the one that was counted.
  chainsNeedRebuild = true;
}

/**
 * Whether these records moved a subscriber, and so changed which ancestors it inherits a mode
 * from.
 *
 * Both added and removed nodes count, because a move reports the two halves separately and
 * they can land in different records when it spans flushes: re-attaching an element that was
 * detached in an earlier flush is reported only as an addition.
 *
 * Chain membership is by node identity, so an `<svg>` between a `foreignObject` and its
 * subscriber is on the chain like any other node and needs no special handling.
 */
function movesSubscriber(records: Array<MutationRecord>): boolean {
  if (chainsNeedRebuild) {
    rebuildChains();
  }
  for (const record of records) {
    if (record.type !== 'childList') {
      continue;
    }
    for (let i = 0; i < record.removedNodes.length; i++) {
      if (chainNodeCounts.has(record.removedNodes[i])) {
        return true;
      }
    }
    for (let i = 0; i < record.addedNodes.length; i++) {
      if (chainNodeCounts.has(record.addedNodes[i])) {
        return true;
      }
    }
  }
  return false;
}

function hasClassChange(records: Array<MutationRecord>): boolean {
  for (const record of records) {
    if (record.type !== 'childList') {
      return true;
    }
  }
  return false;
}

const useMutationSingleton = createSingletonHandler<void>(handler => {
  const fanOut = () => {
    // Memoize ancestor lookups for the duration of this fan-out only. Every subscriber runs
    // synchronously inside handler(), before React processes any effect in the batch, so all
    // of them see one consistent view of the DOM.
    flushCache = new Map();
    try {
      handler();
    } finally {
      flushCache = null;
    }
  };
  const observer = new MutationObserver(records => {
    // A moved subscriber has a new ancestor chain, so the counts must be rebuilt. A class
    // change moves nothing and leaves them valid, so it only wakes the subscribers.
    const moved = movesSubscriber(records);
    if (moved) {
      chainsNeedRebuild = true;
    }
    if (moved || hasClassChange(records)) {
      fanOut();
    }
  });
  const htmlObserver = new MutationObserver(fanOut);
  // A mode is only ever expressed as a class name, so watching `class` is what detects a mode
  // change. Filtering to it avoids waking every subscriber for unrelated attribute changes
  // anywhere in the document, such as the `data-awsui-focus-visible` toggle that
  // focus-visible writes to `<body>` on every keydown and mousedown.
  //
  // `childList` is watched as well because moving an element between subtrees changes its
  // ancestor chain, and therefore its mode, without any class changing. Previously such
  // moves were only picked up incidentally, by whatever unrelated attribute mutation
  // happened to follow. Because that covers every node insertion on the page, and most of
  // them are ordinary rendering that moves no subscriber, `movesSubscriber` discards them
  // before waking anyone.
  observer.observe(document.body, { attributes: true, subtree: true, childList: true, attributeFilter: ['class'] });
  // Modes are also honoured above `<body>`, which the observer above does not cover.
  htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => {
    observer.disconnect();
    htmlObserver.disconnect();
  };
});

function useMutationObserver(elementRef: React.RefObject<HTMLElement>, onChange: (element: HTMLElement) => void) {
  const handler = useStableCallback(() => {
    if (elementRef.current) {
      onChange(elementRef.current);
    }
  });
  useMutationSingleton(handler);

  useEffect(() => {
    subscribeChain(elementRef);
    return () => {
      unsubscribeChain(elementRef);
    };
  }, [elementRef]);

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
