// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';

import { ReactiveStore, useReaction, useSelector } from '../index';
import { act } from 'react-dom/test-utils';

interface State {
  name: string;
  values: Record<string, number>;
}

describe('ReactiveStore', () => {
  let store = new ReactiveStore<State>({ name: '', values: {} });

  beforeEach(() => {
    store = new ReactiveStore<State>({ name: 'Test', values: { A: 1, B: 2 } });
  });

  function Provider({
    store: customStore,
    update,
  }: {
    store?: ReactiveStore<State>;
    update?: (state: State) => State;
  }) {
    const providerStore = customStore ?? store;

    const renderCounter = useRef(0);
    renderCounter.current += 1;

    useReaction(
      providerStore,
      s => s.name,
      (newName, prevName) => {
        const div = document.querySelector('[data-testid="reaction-name"]')!;
        div.textContent = `${prevName} -> ${newName}`;
      }
    );

    return (
      <div>
        <div data-testid="provider">Provider ({renderCounter.current})</div>
        <SubscriberName store={providerStore} />
        <SubscriberItemsList store={providerStore} />
        <StoreUpdater store={providerStore} update={update} />
        <div data-testid="reaction-name"></div>
      </div>
    );
  }

  function StoreUpdater({ store, update }: { store: ReactiveStore<State>; update?: (state: State) => State }) {
    useState(() => {
      if (update) {
        store.set(prev => update(prev));
      }
      return null;
    });
    return null;
  }

  function SubscriberName({ store }: { store: ReactiveStore<State> }) {
    const value = useSelector(store, s => s.name);
    const renderCounter = useRef(0);
    renderCounter.current += 1;
    return (
      <div data-testid="subscriber-name">
        Subscriber name ({renderCounter.current}) {value}
      </div>
    );
  }

  function SubscriberItemsList({ store }: { store: ReactiveStore<State> }) {
    const items = useSelector(store, s => s.values);
    const itemIds = Object.keys(items);
    const renderCounter = useRef(0);
    renderCounter.current += 1;
    return (
      <div>
        <div data-testid="subscriber-items">
          Subscriber items ({renderCounter.current}) {itemIds.join(', ')}
        </div>
        {itemIds.map(itemId => (
          <div key={itemId}>
            <SubscriberItem id={itemId} store={store} />
          </div>
        ))}
      </div>
    );
  }

  function SubscriberItem({ id, store }: { id: string; store: ReactiveStore<State> }) {
    const value = useSelector(store, s => s.values[id]);
    const renderCounter = useRef(0);
    renderCounter.current += 1;
    return (
      <div data-testid={`subscriber-${id}`}>
        Subscriber {id} ({renderCounter.current}) {value}
      </div>
    );
  }

  test('initializes state correctly', () => {
    render(<Provider />);

    expect(screen.getByTestId('provider').textContent).toBe('Provider (1)');
    expect(screen.getByTestId('subscriber-name').textContent).toBe('Subscriber name (1) Test');
    expect(screen.getByTestId('subscriber-items').textContent).toBe('Subscriber items (1) A, B');
    expect(screen.getByTestId('subscriber-A').textContent).toBe('Subscriber A (1) 1');
    expect(screen.getByTestId('subscriber-B').textContent).toBe('Subscriber B (1) 2');
  });

  test('handles updates correctly', () => {
    render(<Provider />);

    act(() => store.set(prev => ({ ...prev, name: 'Test', values: { ...prev.values, B: 3, C: 4 } })));

    expect(screen.getByTestId('provider').textContent).toBe('Provider (1)');
    expect(screen.getByTestId('subscriber-name').textContent).toBe('Subscriber name (1) Test');
    expect(screen.getByTestId('subscriber-items').textContent).toBe('Subscriber items (2) A, B, C');
    expect(screen.getByTestId('subscriber-A').textContent).toBe('Subscriber A (2) 1');
    expect(screen.getByTestId('subscriber-B').textContent).toBe('Subscriber B (2) 3');
    expect(screen.getByTestId('subscriber-C').textContent).toBe('Subscriber C (1) 4');

    act(() => store.set(prev => ({ ...prev, name: 'Updated' })));

    expect(screen.getByTestId('provider').textContent).toBe('Provider (1)');
    expect(screen.getByTestId('subscriber-name').textContent).toBe('Subscriber name (2) Updated');
    expect(screen.getByTestId('subscriber-items').textContent).toBe('Subscriber items (2) A, B, C');
    expect(screen.getByTestId('subscriber-A').textContent).toBe('Subscriber A (2) 1');
    expect(screen.getByTestId('subscriber-B').textContent).toBe('Subscriber B (2) 3');
    expect(screen.getByTestId('subscriber-C').textContent).toBe('Subscriber C (1) 4');
  });

  test('reacts to updates with useReaction', () => {
    render(<Provider />);

    act(() => store.set(prev => ({ ...prev, name: 'Reaction test' })));

    expect(screen.getByTestId('subscriber-name').textContent).toBe('Subscriber name (2) Reaction test');
    expect(screen.getByTestId('reaction-name').textContent).toBe('Test -> Reaction test');
  });

  test('unsubscribes listeners on unmount', () => {
    const { unmount } = render(<Provider />);

    expect(store).toEqual(expect.objectContaining({ _listeners: expect.objectContaining({ length: 5 }) }));

    unmount();

    expect(store).toEqual(expect.objectContaining({ _listeners: expect.objectContaining({ length: 0 }) }));
  });

  test('synchronizes updates done between render and effect', () => {
    render(<Provider update={state => ({ ...state, name: 'Test!' })} />);

    expect(screen.getByTestId('subscriber-name').textContent).toBe('Subscriber name (2) Test!');
  });

  test('reacts to store replacement', () => {
    const { rerender } = render(<Provider />);

    expect(screen.getByTestId('provider').textContent).toBe('Provider (1)');
    expect(screen.getByTestId('subscriber-name').textContent).toBe('Subscriber name (1) Test');
    expect(screen.getByTestId('reaction-name').textContent).toBe('');

    rerender(<Provider store={new ReactiveStore<State>({ name: 'Other test', values: {} })} />);

    expect(screen.getByTestId('provider').textContent).toBe('Provider (2)');
    expect(screen.getByTestId('subscriber-name').textContent).toBe('Subscriber name (3) Other test');
    expect(screen.getByTestId('reaction-name').textContent).toBe('Test -> Other test');
  });
});
