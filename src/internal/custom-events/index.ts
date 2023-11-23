// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

function track(event: CustomEvent) {
  if (typeof (window as any).track === 'function') {
    (window as any).track(event);
  }
}

export const emitCustomEvent = (element: HTMLElement, eventName: string, detail: CustomEvent['detail']) => {
  const customEvent = new CustomEvent(`awsui-component-${eventName}`.toLowerCase(), {
    bubbles: true,
    cancelable: false,
    detail,
  });

  track(customEvent);
  element.dispatchEvent(customEvent);
};

export const emitComponentCustomEvent = (
  element: HTMLElement,
  componentName: string,
  eventName: string,
  detail: CustomEvent['detail']
) => {
  emitCustomEvent(element, `${componentName}-${eventName}`, detail);
};
