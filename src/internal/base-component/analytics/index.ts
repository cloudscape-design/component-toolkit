// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MutableRefObject, useEffect, useLayoutEffect } from 'react';
import { TrackComponentPropertyDetail } from './interfaces';

export function trackEvent(element: HTMLElement, eventName: string, detail: any) {
  (window as any).__awsui__.analytics.trackEvent(element, eventName, detail);
}

export function useTrackPropertyLayoutEffect(
  ref: MutableRefObject<any> | null | undefined,
  componentName: string,
  propertyName: string,
  propertyValue: any
) {
  useLayoutEffect(() => {
    ref &&
      trackEvent(ref.current, 'property-change', {
        componentName,
        detail: {
          [propertyName]: propertyValue,
        },
      } as TrackComponentPropertyDetail);
  }, [ref, propertyValue, propertyName, componentName]);
}

export function useTrackPropertyEffect(
  ref: MutableRefObject<any> | null | undefined,
  componentName: string,
  propertyName: string,
  propertyValue: any
) {
  useEffect(() => {
    ref &&
      trackEvent(ref.current, 'property-change', {
        componentName,
        detail: {
          [propertyName]: propertyValue,
        },
      } as TrackComponentPropertyDetail);
  }, [ref, propertyValue, propertyName, componentName]);
}
