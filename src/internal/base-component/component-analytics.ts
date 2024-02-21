// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RefObject, useEffect } from 'react';
import { ComponentConfiguration } from './metrics/interfaces';
import { trackEvent } from './analytics';

export function useComponentAnalytics<T>(
  ref: RefObject<T>,
  componentName: string,
  props?: ComponentConfiguration['props']
) {
  useEffect(() => {
    if (ref.current) {
      const node = ref.current as unknown as HTMLElement;
      trackEvent(node, 'mount', { componentName, ...props });

      return () => {
        trackEvent(node, 'unmount', { componentName, ...props });
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
