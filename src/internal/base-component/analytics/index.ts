// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MutableRefObject, useEffect, useLayoutEffect } from 'react';
import { Handler, TrackEventDetail } from './interfaces';
import { kebabCaseToCamelCase } from './helpers';

import * as handlers from './handlers';

export function trackEvent(target: HTMLElement, eventName: string, detail: TrackEventDetail) {
  const normalizedEventName = kebabCaseToCamelCase(eventName);

  const componentHandlers = (handlers as any)[detail.componentName] || handlers.fallback;
  if (componentHandlers) {
    const componentHandler: Handler =
      componentHandlers[normalizedEventName] || (handlers.fallback as any)[normalizedEventName];
    if (componentHandler) {
      componentHandler({ target, eventName, detail });
    } else {
      console.warn(`Handler for event '${normalizedEventName}' not found in '${detail.componentName}' handlers.`);
    }
  }
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
      } as TrackEventDetail);
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
      } as TrackEventDetail);
  }, [ref, propertyValue, propertyName, componentName]);
}
