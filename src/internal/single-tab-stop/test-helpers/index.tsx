// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useRef } from 'react';

import { FocusableChangeHandler, SingleTabStopNavigationContext } from '../';
import { useUniqueId } from '../../use-unique-id';

type SetTarget = (focusTarget: null | Element, suppressed?: (null | Element)[]) => void;

interface TestProviderAPI {
  setCurrentTarget: SetTarget;
}

const providerRegistry = new Map<string, TestProviderAPI>();

export const TestSingleTabStopNavigationProvider = ({
  children,
  navigationActive,
}: {
  children: React.ReactNode;
  navigationActive: boolean;
}) => {
  const focusablesRef = useRef(new Set<Element>());
  const focusHandlersRef = useRef(new Map<Element, FocusableChangeHandler>());
  const registerFocusable = useCallback((focusable: HTMLElement, changeHandler: FocusableChangeHandler) => {
    focusablesRef.current.add(focusable);
    focusHandlersRef.current.set(focusable, changeHandler);
    return () => {
      focusablesRef.current.delete(focusable);
      focusHandlersRef.current.delete(focusable);
    };
  }, []);

  const providerId = useUniqueId();
  providerRegistry.set(providerId, {
    setCurrentTarget: (focusTarget, suppressed = []) => {
      focusablesRef.current.forEach(focusable => {
        const handler = focusHandlersRef.current.get(focusable)!;
        handler(focusTarget === focusable || suppressed.includes(focusable));
      });
    },
  });
  useEffect(
    () => () => {
      providerRegistry.delete(providerId);
    },
    [providerId]
  );

  return (
    <SingleTabStopNavigationContext.Provider
      value={{
        navigationActive,
        registerFocusable,
        // The reset target feature is not needed in the test provider, and it is
        // already tested with the actual provider implementation instead.
        // istanbul ignore next
        resetFocusTarget: () => {},
      }}
    >
      {children}
    </SingleTabStopNavigationContext.Provider>
  );
};

export const setTestSingleTabStopNavigationTarget: SetTarget = (focusTarget, suppressed) => {
  Array.from(providerRegistry).forEach(([, provider]) => provider.setCurrentTarget(focusTarget, suppressed));
};
