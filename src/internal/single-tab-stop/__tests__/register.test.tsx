// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { createRef, useContext, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';

import {
  SingleTabStopNavigationAPI,
  SingleTabStopNavigationContext,
  SingleTabStopNavigationProvider,
  useSingleTabStopNavigation,
} from '../';

function Button(props: React.HTMLAttributes<HTMLButtonElement>) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { tabIndex } = useSingleTabStopNavigation(buttonRef, { tabIndex: props.tabIndex });
  return <button {...props} ref={buttonRef} tabIndex={tabIndex} />;
}

function ButtonGroup({
  buttons,
  getNextFocusTarget,
  onUnregisterActive,
  isElementSuppressed,
  apiRef,
}: {
  buttons: string[];
  getNextFocusTarget: () => null | HTMLElement;
  onUnregisterActive?: (element: Element) => void;
  isElementSuppressed?: (element: Element) => boolean;
  apiRef: React.Ref<SingleTabStopNavigationAPI>;
}) {
  return (
    <SingleTabStopNavigationProvider
      ref={apiRef}
      navigationActive={true}
      getNextFocusTarget={getNextFocusTarget}
      onUnregisterActive={onUnregisterActive}
      isElementSuppressed={isElementSuppressed}
    >
      <div>
        {buttons.map(id => (
          <Button key={id} data-testid={id}>
            {id}
          </Button>
        ))}
        <button data-testid="X" tabIndex={0}>
          X
        </button>
      </div>
    </SingleTabStopNavigationProvider>
  );
}

function getButton(testId: string) {
  return document.querySelector(`[data-testid="${testId}"]`) as null | HTMLElement;
}

test('registers focusable elements', () => {
  const apiRef = createRef<SingleTabStopNavigationAPI>();
  const { rerender } = render(
    <ButtonGroup buttons={['A', 'B', 'C']} getNextFocusTarget={() => getButton('A')} apiRef={apiRef} />
  );
  const buttons = [getButton('A')!, getButton('B')!, getButton('C')!, getButton('X')!];

  expect(apiRef.current!.isRegistered(buttons[0])).toBe(true);
  expect(apiRef.current!.isRegistered(buttons[1])).toBe(true);
  expect(apiRef.current!.isRegistered(buttons[2])).toBe(true);
  expect(apiRef.current!.isRegistered(buttons[3])).toBe(false);

  rerender(<ButtonGroup buttons={['A', 'B']} getNextFocusTarget={() => getButton('A')} apiRef={apiRef} />);

  expect(apiRef.current!.isRegistered(buttons[0])).toBe(true);
  expect(apiRef.current!.isRegistered(buttons[1])).toBe(true);
  expect(apiRef.current!.isRegistered(buttons[2])).toBe(false);
  expect(apiRef.current!.isRegistered(buttons[3])).toBe(false);
});

test('updates and retrieves focus target', () => {
  const focusTarget = { current: 'A' };
  const apiRef = createRef<SingleTabStopNavigationAPI>();
  render(
    <ButtonGroup buttons={['A', 'B']} getNextFocusTarget={() => getButton(focusTarget.current)} apiRef={apiRef} />
  );

  expect(getButton('A')).toHaveAttribute('tabIndex', '-1');
  expect(getButton('B')).toHaveAttribute('tabIndex', '-1');
  expect(getButton('X')).toHaveAttribute('tabIndex', '0');

  apiRef.current!.updateFocusTarget();
  expect(apiRef.current!.getFocusTarget()).toBe(getButton('A'));
  expect(getButton('A')).toHaveAttribute('tabIndex', '0');
  expect(getButton('B')).toHaveAttribute('tabIndex', '-1');
  expect(getButton('X')).toHaveAttribute('tabIndex', '0');

  focusTarget.current = 'B';
  apiRef.current!.updateFocusTarget();
  expect(apiRef.current!.getFocusTarget()).toBe(getButton('B'));
  expect(getButton('A')).toHaveAttribute('tabIndex', '-1');
  expect(getButton('B')).toHaveAttribute('tabIndex', '0');
  expect(getButton('X')).toHaveAttribute('tabIndex', '0');

  focusTarget.current = 'X';
  apiRef.current!.updateFocusTarget();
  expect(apiRef.current!.getFocusTarget()).toBe(getButton('X'));
  expect(getButton('A')).toHaveAttribute('tabIndex', '-1');
  expect(getButton('B')).toHaveAttribute('tabIndex', '-1');
  expect(getButton('X')).toHaveAttribute('tabIndex', '0');
});

test('ignores elements that are suppressed', () => {
  const apiRef = createRef<SingleTabStopNavigationAPI>();
  const { rerender } = render(
    <ButtonGroup buttons={['A', 'B']} getNextFocusTarget={() => getButton('A')} apiRef={apiRef} />
  );

  apiRef.current!.updateFocusTarget();
  expect(getButton('A')).toHaveAttribute('tabIndex', '0');
  expect(getButton('B')).toHaveAttribute('tabIndex', '-1');

  rerender(
    <ButtonGroup
      buttons={['A', 'B']}
      getNextFocusTarget={() => getButton('A')}
      isElementSuppressed={element => element === getButton('B')}
      apiRef={apiRef}
    />
  );
  expect(getButton('A')).toHaveAttribute('tabIndex', '0');
  expect(getButton('B')).toHaveAttribute('tabIndex', '0');
});

test('calls onUnregisterActive', async () => {
  const apiRef = createRef<SingleTabStopNavigationAPI>();
  const onUnregisterActive = jest.fn();
  const { rerender } = render(
    <ButtonGroup
      buttons={['A', 'B']}
      getNextFocusTarget={() => getButton('A')}
      onUnregisterActive={onUnregisterActive}
      apiRef={apiRef}
    />
  );

  getButton('A')!.focus();

  rerender(
    <ButtonGroup
      buttons={['A', 'B']}
      getNextFocusTarget={() => getButton('A')}
      onUnregisterActive={onUnregisterActive}
      apiRef={apiRef}
    />
  );
  await waitFor(() => {
    expect(onUnregisterActive).toHaveBeenCalledWith(getButton('A'));
  });
});

test('context defaults', () => {
  function Button() {
    const context = useContext(SingleTabStopNavigationContext);
    // Checking the default registerFocusable is defined.
    context.registerFocusable(document.createElement('div'), () => {})();
    return <button>{context.navigationActive ? 'active' : 'inactive'}</button>;
  }

  render(<Button />);

  expect(document.querySelector('button')!.textContent).toBe('inactive');
});
