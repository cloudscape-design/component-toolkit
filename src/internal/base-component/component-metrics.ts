// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RefObject, useEffect } from 'react';
import { Metrics } from './metrics/metrics';
import { trackEvent } from '../custom-events';

interface Settings {
  packageSource: string;
  packageVersion: string;
  theme: string;
}

export function useComponentMetrics<T>(
  ref: RefObject<T>,
  componentName: string,
  { packageSource, packageVersion, theme }: Settings
) {
  useEffect(() => {
    const metrics = new Metrics(packageSource, packageVersion);

    metrics.initMetrics(theme);
    if (typeof window !== 'undefined') {
      metrics.sendMetricOnce('awsui-viewport-width', window.innerWidth || 0);
      metrics.sendMetricOnce('awsui-viewport-height', window.innerHeight || 0);
    }
    metrics.logComponentLoaded();
    metrics.logComponentUsed(componentName.toLowerCase());

    if (ref.current) {
      const node = ref.current as unknown as HTMLElement;
      trackEvent(node, 'mounted', { componentName, packageSource, packageVersion, theme });

      return () => {
        trackEvent(node, 'unmounted', { componentName, packageSource, packageVersion, theme });
      };
    }

    // Components do not change the name dynamically. Explicit empty array to prevent accidental double metrics
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
