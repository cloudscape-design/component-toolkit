// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { createSingletonHandler } from '../index';

function setup() {
  const state = {
    subscriptions: 0,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: (value: number) => {},
  };
  const useSingleton = createSingletonHandler<number>(handler => {
    state.subscriptions++;
    state.handler = handler;
    return () => state.subscriptions--;
  });

  function Demo({ onChange }: { onChange: (value: number) => void }) {
    useSingleton(onChange);
    return null;
  }

  return { Demo, state };
}

test('should create and cleanup singleton subscriptions', () => {
  const { Demo, state } = setup();
  const { rerender } = render(<Demo onChange={() => {}} />);
  expect(state.subscriptions).toEqual(1);
  rerender(
    <>
      <Demo onChange={() => {}} />
      <Demo onChange={() => {}} />
    </>
  );
  expect(state.subscriptions).toEqual(1);
  rerender(<Demo onChange={() => {}} />);
  expect(state.subscriptions).toEqual(1);
  rerender(<>empty</>);
  expect(state.subscriptions).toEqual(0);
});

test('should notify listeners when value changes', () => {
  const { Demo, state } = setup();
  const onChangeFirst = jest.fn();
  const onChangeSecond = jest.fn();
  render(
    <>
      <Demo onChange={onChangeFirst} />
      <Demo onChange={onChangeSecond} />
    </>
  );
  state.handler(123);
  expect(onChangeFirst).toHaveBeenCalledWith(123);
  expect(onChangeSecond).toHaveBeenCalledWith(123);
});

test('should remove listeners when component unmounts', () => {
  const { Demo, state } = setup();
  const onChangeFirst = jest.fn();
  const onChangeSecond = jest.fn();
  const { rerender } = render(
    <>
      <Demo onChange={onChangeFirst} />
      <Demo onChange={onChangeSecond} />
    </>
  );
  state.handler(123);
  expect(onChangeFirst).toHaveBeenCalledTimes(1);
  expect(onChangeSecond).toHaveBeenCalledTimes(1);
  rerender(
    <>
      <Demo onChange={onChangeFirst} />
    </>
  );
  state.handler(123);
  expect(onChangeFirst).toHaveBeenCalledTimes(2);
  expect(onChangeSecond).toHaveBeenCalledTimes(1);
});

test('should notify listeners in registration order', () => {
  const { Demo, state } = setup();
  const callOrder: string[] = [];
  const onChangeFirst = jest.fn(() => callOrder.push('first'));
  const onChangeSecond = jest.fn(() => callOrder.push('second'));
  const onChangeThird = jest.fn(() => callOrder.push('third'));
  render(
    <>
      <Demo onChange={onChangeFirst} />
      <Demo onChange={onChangeSecond} />
      <Demo onChange={onChangeThird} />
    </>
  );
  state.handler(42);
  expect(callOrder).toEqual(['first', 'second', 'third']);
});

test('should handle rapid mount/unmount cycles correctly', () => {
  const { Demo, state } = setup();
  const onChange1 = jest.fn();
  const onChange2 = jest.fn();
  const onChange3 = jest.fn();

  const { rerender, unmount } = render(<Demo onChange={onChange1} />);
  expect(state.subscriptions).toEqual(1);

  // Rapid additions
  rerender(
    <>
      <Demo onChange={onChange1} />
      <Demo onChange={onChange2} />
    </>
  );
  rerender(
    <>
      <Demo onChange={onChange1} />
      <Demo onChange={onChange2} />
      <Demo onChange={onChange3} />
    </>
  );
  expect(state.subscriptions).toEqual(1);

  state.handler(100);
  expect(onChange1).toHaveBeenCalledWith(100);
  expect(onChange2).toHaveBeenCalledWith(100);
  expect(onChange3).toHaveBeenCalledWith(100);

  // Complete cleanup
  unmount();
  expect(state.subscriptions).toEqual(0);
});
