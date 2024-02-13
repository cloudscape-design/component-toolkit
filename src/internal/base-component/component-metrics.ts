// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';
import { Metrics } from './metrics/metrics';
import { ComponentConfiguration, PackageSettings } from './metrics/interfaces';

export { ComponentConfiguration };

export function useComponentMetrics(
  componentName: string,
  { packageSource, packageVersion, theme }: PackageSettings,
  configuration: ComponentConfiguration = { props: {} }
) {
  useEffect(() => {
    const metrics = new Metrics(packageSource, packageVersion);

    metrics.initMetrics(theme);
    if (typeof window !== 'undefined') {
      metrics.sendMetricOnce('awsui-viewport-width', window.innerWidth || 0);
      metrics.sendMetricOnce('awsui-viewport-height', window.innerHeight || 0);
    }
    metrics.logComponentsLoaded();
    metrics.logComponentUsed(componentName.toLowerCase(), configuration);
    // Components do not change the name dynamically. Explicit empty array to prevent accidental double metrics
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
