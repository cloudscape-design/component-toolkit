// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RefObject, useEffect } from 'react';
import { ComponentConfiguration } from './metrics/interfaces';
import { trackEvent } from './analytics';

export { ComponentConfiguration };

export function useComponentAnalytics<T>(
  ref: RefObject<T>,
  componentName: string,
  configuration: ComponentConfiguration = { props: {} }
) {
  useEffect(() => {
    if (ref.current) {
      const node = ref.current as unknown as HTMLElement;
      trackEvent(node, 'mount', { componentName, configuration });

      return () => {
        trackEvent(node, 'unmount', { componentName, configuration });
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
