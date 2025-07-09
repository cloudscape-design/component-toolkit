// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useFocusVisible } from '../';

function Fixture() {
  useFocusVisible();
  return <button>Test</button>;
}

test('should disable focus by default', () => {
  render(<Fixture />);
  expect(document.body).not.toHaveAttribute('data-awsui-focus-visible');
});

[
  { key: 'Shift', keyCode: 16 },
  { key: 'Alt', keyCode: 17 },
  { key: 'Control', keyCode: 18 },
  { key: 'Meta', keyCode: 91 },
].forEach(key => {
  test(`should not enable focus when ${key.key} key is pressed`, () => {
    render(<Fixture />);
    fireEvent.keyDown(document.body, key);
    expect(document.body).not.toHaveAttribute('data-awsui-focus-visible');
  });
});

test(`should enable focus when shift-tab is pressed`, () => {
  render(<Fixture />);
  fireEvent.keyDown(document.body, { key: 'Tab', keyCode: 65, shiftKey: true });
  expect(document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
});

test('should enable focus when keyboard interaction happened', () => {
  render(<Fixture />);
  fireEvent.keyDown(document.body);
  expect(document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
});

test('should disable focus when mouse is used after keyboard', () => {
  render(<Fixture />);
  fireEvent.keyDown(document.body);
  fireEvent.mouseDown(document.body);
  expect(document.body).not.toHaveAttribute('data-awsui-focus-visible');
});

test('should work with multiple components', () => {
  render(
    <>
      <Fixture />
      <Fixture />
    </>
  );
  fireEvent.keyDown(document.body);
  expect(document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
});

test('should add listeners only once', () => {
  const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
  const { rerender } = render(
    <>
      <Fixture />
      <Fixture />
    </>
  );

  expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
  const signal = (addEventListenerSpy.mock.calls[0][2] as AddEventListenerOptions).signal!;
  expect(signal.aborted).toBe(false);

  addEventListenerSpy.mockClear();
  rerender(<Fixture />);
  expect(addEventListenerSpy).toHaveBeenCalledTimes(0);
  expect(signal.aborted).toBe(false);

  rerender(<span />);
  expect(addEventListenerSpy).toHaveBeenCalledTimes(0);
  expect(signal.aborted).toBe(true);
});

test('should initialize late components with updated state', () => {
  const { rerender } = render(<Fixture key={1} />);
  fireEvent.keyDown(document.body);
  expect(document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
  rerender(<Fixture key={2} />);
  expect(document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
});
