// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

interface TrackEvent {
  element: HTMLElement;
  eventName: string;
  detail: any;
}

interface BufferEvent {
  event: TrackEvent;
  domSnapshot: HTMLElement;
}

const analytics = {
  eventBuffer: [] as BufferEvent[],
  eventBufferMaxSize: 1000,
  trackEvent: function (element: HTMLElement, eventName: string, detail: any) {
    if (this.eventBuffer.length < this.eventBufferMaxSize) {
      const domSnapshot = document.body.cloneNode(true) as HTMLElement;
      this.eventBuffer.push({
        event: {
          element,
          eventName,
          detail,
        },
        domSnapshot,
      });
    }
  },
};
(window as any).__awsui__ = (window as any).__awsui || { analytics };

export function trackEvent(element: HTMLElement, eventName: string, detail: any) {
  (window as any).__awsui__.analytics.trackEvent(element, eventName, detail);
}
