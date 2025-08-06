// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { createSingletonState } from '../index';

function setup() {
  const state = {
    value: 0,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: (value: number) => {},
  };
  const useSingletonState = createSingletonState({
    initialState: () => state.value,
    factory: handler => {
      state.handler = value => {
        handler(value);
        state.value = value;
      };
      return () => {};
    },
  });

  function Demo({ id }: { id: string }) {
    const state = useSingletonState();
    return (
      <div>
        {id}: {state}
      </div>
    );
  }

  return { Demo, state };
}

test('should render updated value', () => {
  const { Demo, state } = setup();
  const { container } = render(
    <>
      <Demo id="first" />
      <Demo id="second" />
    </>
  );
  expect(container).toHaveTextContent('first: 0');
  expect(container).toHaveTextContent('second: 0');
  state.handler(123);
  expect(container).toHaveTextContent('first: 123');
  expect(container).toHaveTextContent('second: 123');
});

test('should use updated value for late-rendered components', () => {
  const { Demo, state } = setup();
  const { container, rerender } = render(
    <>
      <Demo id="first" />
    </>
  );
  state.handler(123);
  rerender(
    <>
      <Demo id="first" />
      <Demo id="second" />
    </>
  );
  expect(container).toHaveTextContent('first: 123');
  expect(container).toHaveTextContent('second: 123');
});

test('should use latest value from the global state', () => {
  const { Demo, state } = setup();
  const { container, rerender } = render(<Demo id="first" />);
  expect(container).toHaveTextContent('first: 0');
  state.handler(123);
  expect(container).toHaveTextContent('first: 123');
  rerender(<></>);
  // value changes when there are no active listeners
  state.value = 456;
  rerender(<Demo id="first" />);
  expect(container).toHaveTextContent('first: 456');
});
