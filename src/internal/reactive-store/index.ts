// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from 'react';

type Selector<S, R> = (state: S) => R;
type Listener<S> = (state: S, prevState: S) => void;

export interface ReadonlyReactiveStore<S> {
  get(): S;
  subscribe<R>(selector: Selector<S, R>, listener: Listener<S>): () => void;
  unsubscribe(listener: Listener<S>): void;
}

/**
 * A pub/sub state management util that registers listeners by selectors.
 * It comes with React utils that subscribe to state changes and trigger effects or React state updates.
 *
 * For simple states, a store can be defined as `ReactiveStore<StateType>`. For more complex states,
 * it is recommended to create a custom class extending ReactiveStore and providing custom setters,
 * for example:
 *   class TableStore extends ReactiveStore<TableState> {
 *     setVisibleColumns(visibleColumns) {
 *       this.set((prev) => ({ ...prev, visibleColumns }));
 *     }
 *     // ...
 *   }
 *
 * The store instance is usually created once when the component is mounted, which can be achieved with React's
 * useRef or useMemo utils. To make the store aware of component's properties it is enough to assign them on
 * every render, unless a state recomputation is required (in which case a useEffect is needed).
 *   const store = useRef(new TableStore()).current;
 *   store.totalColumns = props.totalColumns;
 *
 * As long as every selector un-subscribes on un-mount (which is the case when `useSelector()` helper is used),
 * there is no need to do any cleanup on the store itself.
 */
export class ReactiveStore<S> implements ReadonlyReactiveStore<S> {
  private _state: S;
  private _listeners: [Selector<S, unknown>, Listener<S>][] = [];

  constructor(state: S) {
    this._state = state;
  }

  public get(): S {
    return this._state;
  }

  public set(cb: (state: S) => S): void {
    const prevState = this._state;
    const newState = cb(prevState);

    this._state = newState;

    for (const [selector, listener] of this._listeners) {
      if (selector(prevState) !== selector(newState)) {
        listener(newState, prevState);
      }
    }
  }

  public subscribe<R>(selector: Selector<S, R>, listener: Listener<S>): () => void {
    this._listeners.push([selector, listener]);
    return () => this.unsubscribe(listener);
  }

  public unsubscribe(listener: Listener<S>): void {
    this._listeners = this._listeners.filter(([, storedListener]) => storedListener !== listener);
  }
}

/**
 * Triggers an effect every time the selected store state changes.
 */
export function useReaction<S, R>(
  store: ReadonlyReactiveStore<S>,
  selector: Selector<S, R>,
  effect: Listener<R>
): void {
  const prevStore = useRef(store);
  useEffect(
    () => {
      if (prevStore.current !== store) {
        effect(selector(store.get()), selector(prevStore.current.get()));
        prevStore.current = store;
      }
      const unsubscribe = store.subscribe(selector, (next, prev) => effect(selector(next), selector(prev)));
      return unsubscribe;
    },
    // Ignoring selector and effect as they are expected to stay constant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store]
  );
}

/**
 * Creates React state that updates every time the selected store state changes.
 */
export function useSelector<S, R>(store: ReadonlyReactiveStore<S>, selector: Selector<S, R>): R {
  const [state, setState] = useState<R>(selector(store.get()));

  // We create subscription synchronously during the first render cycle to ensure the store updates that
  // happen after the first render but before the first effect are not lost.
  const unsubscribeRef = useRef(store.subscribe(selector, newState => setState(selector(newState))));
  // When the component is un-mounted or the store reference changes, the old subscription is cancelled
  // (and the new subscription is created for the new store instance).
  const prevStore = useRef(store);
  useEffect(() => {
    if (prevStore.current !== store) {
      setState(selector(store.get()));
      unsubscribeRef.current = store.subscribe(selector, newState => setState(selector(newState)));
      prevStore.current = store;
    }
    return () => unsubscribeRef.current();
    // Ignoring selector as it is expected to stay constant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  return state;
}
