// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MutableRefObject, useEffect, useLayoutEffect } from 'react';
import { trackEvent } from '.';

export interface TrackComponentPropertyDetail {
  componentName: string;
  detail: {
    [propertyName: string]: any;
  };
}

export function useTrackComponentProperty(
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

export function useTrackComponentPropertyAfterRender(
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
