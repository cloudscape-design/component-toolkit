// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface TrackEvent {
  target: HTMLElement;
  eventName: string;
  detail: any;
}

export interface BufferEvent {
  event: TrackEvent;
  domSnapshot: HTMLElement;
}

export interface TrackComponentPropertyDetail {
  componentName: string;
  detail: {
    [propertyName: string]: any;
  };
}
