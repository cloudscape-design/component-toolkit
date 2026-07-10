// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

type ValueCallback<T> = (value: T) => void;
type CleanupCallback = () => void;
export type UseSingleton<T> = (listener: ValueCallback<T>) => void;

export function createSingletonHandler<T>(factory: (handler: ValueCallback<T>) => CleanupCallback): UseSingleton<T> {
  // Using Set for O(1) add/delete operations instead of Array's O(n) indexOf + splice.
  // Sets maintain insertion order (ES2015+), preserving iteration consistency.
  const listeners = new Set<ValueCallback<T>>();
  const callback: ValueCallback<T> = value => {
    unstable_batchedUpdates(() => {
      for (const listener of listeners) {
        listener(value);
      }
    });
  };
  let cleanup: (() => void) | undefined;

  return function useSingleton(listener: ValueCallback<T>) {
    useEffect(() => {
      if (listeners.size === 0) {
        cleanup = factory(callback);
      }
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          cleanup!();
          cleanup = undefined;
        }
      };
      // register handlers only on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  };
}

interface SingletonStateOptions<T> {
  factory: (handler: ValueCallback<T>) => CleanupCallback;
  initialState: T | (() => T); // useState signature
}

export function createSingletonState<T>({ factory, initialState }: SingletonStateOptions<T>) {
  const useSingleton = createSingletonHandler(factory);
  return function useSingletonState() {
    const [state, setState] = useState<T>(initialState);
    useSingleton(setState);
    return state;
  };
}
