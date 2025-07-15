// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { render, fireEvent } from '@testing-library/react';
import { useFocusVisible } from '..';

function Fixture() {
  const ref = useRef<HTMLButtonElement | null>(null);
  useFocusVisible(ref);
  return <button ref={ref}>Test</button>;
}

function FramePortal({ children }: { children: React.ReactNode }) {
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(null);

  return (
    <iframe ref={setIframeElement}>
      {iframeElement?.contentDocument && ReactDOM.createPortal(children, iframeElement.contentDocument.body)}
    </iframe>
  );
}

test('should disable focus by default', () => {
  render(
    <FramePortal>
      <Fixture />
    </FramePortal>
  );
  const frame = window.frames[0]!;
  expect(frame.document.body).not.toHaveAttribute('data-awsui-focus-visible');
});

test('should enable focus when keyboard interaction happened in the main document', () => {
  render(
    <>
      {/* Component in the main document to make sure listeners are added here too */}
      <Fixture />
      <FramePortal>
        <Fixture />
      </FramePortal>
    </>
  );
  const frame = window.frames[0]!;
  fireEvent.keyDown(document.body);
  expect(document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
  expect(frame.document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
});

test('should enable focus when keyboard interaction happened in the frame document', () => {
  render(
    <>
      {/* Component in the main document to make sure listeners are added here too */}
      <Fixture />
      <FramePortal>
        <Fixture />
      </FramePortal>
    </>
  );
  const frame = window.frames[0]!;
  fireEvent.keyDown(frame.document.body);
  expect(document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
  expect(frame.document.body).toHaveAttribute('data-awsui-focus-visible', 'true');
});

test('should disable focus when mouse is used in the main document after keyboard', () => {
  render(
    <>
      {/* Component in the main document to make sure listeners are added here too */}
      <Fixture />
      <FramePortal>
        <Fixture />
      </FramePortal>
    </>
  );
  const frame = window.frames[0]!;
  fireEvent.keyDown(document.body);
  fireEvent.mouseDown(document.body);
  expect(document.body).not.toHaveAttribute('data-awsui-focus-visible');
  expect(frame.document.body).not.toHaveAttribute('data-awsui-focus-visible');
});

test('should disable focus when mouse is used in the frame document after keyboard', () => {
  render(
    <FramePortal>
      <Fixture />
    </FramePortal>
  );
  const frame = window.frames[0]!;
  fireEvent.keyDown(frame.document.body);
  fireEvent.mouseDown(frame.document.body);
  expect(frame.document.body).not.toHaveAttribute('data-awsui-focus-visible');
});

test('should remove listeners only from frame when the frame is unmounted', () => {
  const outerAddEventListenerSpy = jest.spyOn(document, 'addEventListener');
  const { rerender } = render(
    <>
      <Fixture />
      <FramePortal>
        <span />
      </FramePortal>
    </>
  );

  const frame = window.frames[0]!;
  const innerAddEventListenerSpy = jest.spyOn(frame.document, 'addEventListener');
  rerender(
    <>
      <Fixture />
      <FramePortal>
        <Fixture />
      </FramePortal>
    </>
  );

  expect(outerAddEventListenerSpy).toHaveBeenCalledTimes(2);
  const outerSignal = (outerAddEventListenerSpy.mock.calls[0][2] as AddEventListenerOptions).signal!;
  expect(outerSignal.aborted).toBe(false);

  expect(innerAddEventListenerSpy).toHaveBeenCalledTimes(2);
  const innerSignal = (innerAddEventListenerSpy.mock.calls[0][2] as AddEventListenerOptions).signal!;
  expect(innerSignal.aborted).toBe(false);

  rerender(
    <>
      <Fixture />
      <FramePortal>
        <span />
      </FramePortal>
    </>
  );
  expect(innerSignal.aborted).toBe(true);
  expect(outerSignal.aborted).toBe(false);
});
