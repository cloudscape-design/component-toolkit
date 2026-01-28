// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { unstable_batchedUpdates } from 'react-dom';
import { useEffect, useLayoutEffect } from 'react';
import { ContainerQueryEntry, ElementReference } from './interfaces.js';
import { useStableCallback } from '../stable-callback/index.js';

/**
 * Attaches resize-observer to the referenced element.
 *
 * @remarks
 *
 * The hook has no control over the referenced element. It is up to the consumer to ensure
 * the element lifecycle and notify the hook by updating the `elementRef`.
 *
 * @example
 * With React reference
 * ```
 * const ref = useRef(null)
 * useResizeObserver(ref, (entry) => setState(getWidth(entry)))
 * ```
 *
 * @example
 * With ID reference
 * ```
 * const getElement = useCallback(() => document.getElementById(id), [id])
 * useResizeObserver(getElement, (entry) => setState(getWidth(entry)))
 * ```
 *
 * @param elementRef React reference or memoized getter for the target element
 * @param onObserve Function to fire when observation occurs
 */
export function useResizeObserver(elementRef: ElementReference, onObserve: (entry: ContainerQueryEntry) => void) {
  const stableOnObserve = useStableCallback(onObserve);

  // This effect provides a synchronous update required to prevent flakiness when initial state and first observed state are different.
  // Can potentially conflict with React concurrent mode: https://17.reactjs.org/docs/concurrent-mode-intro.html.
  // TODO: A possible solution would be to make consumers not render any content until the first (asynchronous) observation is available.
  useLayoutEffect(
    () => {
      const element = typeof elementRef === 'function' ? elementRef() : elementRef?.current;
      if (element) {
        const rect = element.getBoundingClientRect();
        onObserve(convertElementToEntry(element, rect));
      }
    },
    // This effect is only needed for the first render to provide a synchronous update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const element = typeof elementRef === 'function' ? elementRef() : elementRef?.current;
    if (element && typeof ResizeObserver !== 'undefined') {
      let connected = true;
      const observer = new ResizeObserver(entries => {
        // Prevent observe notifications on already unmounted component.
        if (connected) {
          unstable_batchedUpdates(() => {
            stableOnObserve(convertResizeObserverEntry(entries[0]));
          });
        }
      });
      observer.observe(element, { box: 'border-box' });
      return () => {
        connected = false;
        observer.disconnect();
      };
    }
  }, [elementRef, stableOnObserve]);
}

function convertResizeObserverEntry(entry: ResizeObserverEntry): ContainerQueryEntry {
  return {
    target: entry.target,
    contentBoxWidth: entry.contentBoxSize[0].inlineSize,
    contentBoxHeight: entry.contentBoxSize[0].blockSize,
    borderBoxWidth: entry.borderBoxSize[0].inlineSize,
    borderBoxHeight: entry.borderBoxSize[0].blockSize,
  };
}

function convertElementToEntry(element: Element, rect: DOMRect): ContainerQueryEntry {
  const computedStyle = window.getComputedStyle(element);
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
  const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
  const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
  const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
  const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

  return {
    target: element,
    contentBoxWidth: rect.width - paddingLeft - paddingRight - borderLeft - borderRight,
    contentBoxHeight: rect.height - paddingTop - paddingBottom - borderTop - borderBottom,
    borderBoxWidth: rect.width,
    borderBoxHeight: rect.height,
  };
}
