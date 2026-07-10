// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';
import { Metrics } from './metrics/metrics.js';
import { ComponentConfiguration, PackageSettings } from './metrics/interfaces.js';

export { ComponentConfiguration };

export function useComponentMetrics(
  componentName: string,
  settings: PackageSettings,
  configuration: ComponentConfiguration = { props: {} }
) {
  useEffect(() => {
    const metrics = new Metrics(settings);

    if (typeof window !== 'undefined') {
      metrics.sendOpsMetricValue('awsui-viewport-width', window.innerWidth || 0);
      metrics.sendOpsMetricValue('awsui-viewport-height', window.innerHeight || 0);
    }
    metrics.logComponentsLoaded();
    metrics.logComponentUsed(componentName.toLowerCase(), configuration);
    // Components do not change the name dynamically. Explicit empty array to prevent accidental double metrics
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
