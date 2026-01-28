// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useRef, useState, useCallback } from 'react';
import { ContainerQueryEntry } from './interfaces.js';
import { useResizeObserver } from '../internal/container-queries/use-resize-observer.js';

/**
 * Attaches resize-observer to the referenced element and keeps last observation in state.
 * The hook allows to limit the amount of re-renders to only when the observed value changes.
 *
 * @example
 * Switching display mode under a given condition (only re-renders when mode changes):
 * ```
 * const [smallMode, ref] = useContainerQuery(entry => entry.contentBoxHeight <= smallModeHeight, [smallModeHeight])
 * ```
 *
 * @example
 * Obtaining observer entry (re-renders with each observation):
 * ```
 * const [entry, ref] = useContainerQuery(entry => entry)
 * ```
 *
 * @example
 * Using previous state to avoid unnecessary re-renders:
 * ```
 * const [value, ref] = useContainerQuery((entry, prev) => shouldUpdate(entry) ? getValue(entry) : prev)
 * ```
 *
 * @typeParam ObservedState State obtained from the last observation
 * @param mapFn Function to convert ContainerQueryEntry to ObservedState
 * @param deps Dependency list to indicate when the mapFn changes
 * @returns A tuple of the observed state and a reference to be attached to the target element
 */
export default function useContainerQuery<ObservedState>(
  mapFn: (entry: ContainerQueryEntry, prev: null | ObservedState) => ObservedState,
  deps: React.DependencyList = []
): [null | ObservedState, React.Ref<any>] {
  const elementRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<null | ObservedState>(null);

  // Update getElement when deps change to trigger new observation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getElement = useCallback(() => elementRef.current, deps);

  useResizeObserver(getElement, entry => setState(prevState => mapFn(entry, prevState)));

  return [state, elementRef];
}
