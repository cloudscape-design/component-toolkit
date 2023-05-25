// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useImperativeHandle } from 'react';
import { render, act } from '@testing-library/react';
import useControllableState from '../use-controllable-state';

interface Props {
  value: string | undefined;
  defaultValue?: string;
  onChange?: (event: any) => void;
  fireEvent?: (value: string, handler: (event: any) => unknown) => void;
}

interface Ref {
  value: string | undefined;
  setValue: (newValue: string) => void;
}

const TestComponent = React.forwardRef(
  ({ value, defaultValue = 'the default value', onChange, fireEvent }: Props, ref: React.Ref<Ref>) => {
    const [hookValue, setHookValue] = useControllableState(
      value,
      onChange,
      defaultValue,
      {
        componentName: 'MyComponent',
        propertyName: 'value',
        changeHandlerName: 'onChange',
      },
      fireEvent
    );

    useImperativeHandle(ref, () => ({ value: hookValue, setValue: setHookValue }));

    return null;
  }
);

function renderHook(props: Props) {
  const ref = React.createRef<Ref>();
  const { container, rerender } = render(<TestComponent ref={ref} {...props} />);
  return { container, rerender: (newProps: Props) => rerender(<TestComponent ref={ref} {...newProps} />), ref };
}

let consoleWarnSpy: jest.SpyInstance;
afterEach(() => {
  consoleWarnSpy?.mockRestore();
});

describe('useControllableState', () => {
  test('only prints a warning if the property switches from controlled to uncontrolled', () => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { ref, rerender } = renderHook({ value: 'a value', onChange: () => undefined });

    expect(console.warn).not.toHaveBeenCalled();

    rerender({ value: undefined, onChange: () => undefined });

    expect(ref.current!.value).toBe(undefined);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      "[AwsUi] [MyComponent] A component tried to change controlled 'value' property to be uncontrolled. " +
        'This is not supported. Properties should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled mode for the lifetime of the component. ' +
        'More info: https://fb.me/react-controlled-components'
    );
  });

  test('only prints a warning if the property switches from uncontrolled to controlled', () => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { ref, rerender } = renderHook({ value: undefined });

    expect(console.warn).not.toHaveBeenCalled();

    rerender({ value: 'a value' });

    expect(ref.current!.value).toBe('the default value');
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      "[AwsUi] [MyComponent] A component tried to change uncontrolled 'value' property to be controlled. " +
        'This is not supported. Properties should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled mode for the lifetime of the component. ' +
        'More info: https://fb.me/react-controlled-components'
    );
  });

  test('prints a warning if the onChange handler is missing', () => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderHook({ value: 'any value' });

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      '[AwsUi] [MyComponent] You provided a `value` prop without an `onChange` handler. This will render a non-interactive component.'
    );
  });

  test('tracks the defaultValue if and only if the component is uncontrolled and unchanged', () => {
    const { ref, rerender } = renderHook({ value: undefined });

    expect(ref.current!.value).toBe('the default value');

    rerender({ value: undefined, defaultValue: 'a different default value' });
    expect(ref.current!.value).toBe('a different default value');

    act(() => ref.current!.setValue('a value set inside the component'));
    expect(ref.current!.value).toBe('a value set inside the component');

    rerender({ value: undefined, defaultValue: 'another different default value' });
    expect(ref.current!.value).toBe('a value set inside the component');
  });

  test('if property is provided, the component is controlled', () => {
    const onChange = jest.fn();
    const { ref, rerender } = renderHook({ value: 'value one', onChange });

    expect(ref.current!.value).toBe('value one');

    rerender({ value: 'value two', onChange });
    expect(ref.current!.value).toBe('value two');

    act(() => ref.current!.setValue('a value set from inside the component'));
    expect(ref.current!.value).toBe('value two');
    expect(onChange).toHaveBeenCalledWith('a value set from inside the component');
  });

  test('if property is not provided, the component is uncontrolled', () => {
    const { ref } = renderHook({ value: undefined });

    expect(ref.current!.value).toBe('the default value');

    act(() => ref.current!.setValue('another value'));
    expect(ref.current!.value).toBe('another value');

    act(() => ref.current!.setValue(ref.current!.value + ' but modified'));
    expect(ref.current!.value).toBe('another value but modified');

    act(() => ref.current!.setValue(undefined!));
    expect(ref.current!.value).toBe(undefined);
  });

  test('custom fireEvent is not executed when the component is uncontrolled', () => {
    const fireEvent = jest.fn();
    const { ref } = renderHook({ value: undefined, fireEvent });

    act(() => ref.current!.setValue('another value'));
    expect(fireEvent).not.toHaveBeenCalled();
  });

  test('onChange is not executed when custom fireEvent does not call it', () => {
    const onChange = jest.fn();
    const fireEvent = jest.fn();
    const { ref } = renderHook({ value: 'a value', onChange, fireEvent });

    act(() => ref.current!.setValue('another value'));
    expect(fireEvent).toHaveBeenCalledWith('another value', onChange);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('onChange is executed when fireEvent is not defined', () => {
    const onChange = jest.fn();
    const { ref } = renderHook({ value: 'a value', onChange });

    act(() => ref.current!.setValue('another value'));
    expect(onChange).toHaveBeenCalledWith('another value');
  });

  test('fireEvent can be used to transform value', () => {
    const onChange = jest.fn();
    const fireEvent = (value: string, handler: (event: any) => unknown) => handler({ detail: { value } });
    const { ref } = renderHook({ value: 'a value', onChange, fireEvent });

    act(() => ref.current!.setValue('another value'));
    expect(onChange).toHaveBeenCalledWith({ detail: { value: 'another value' } });
  });
});
