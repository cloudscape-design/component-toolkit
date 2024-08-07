// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CLogClient, PanoramaClient, MetricsV2EventItem } from './log-clients';
import { buildMetricDetail, buildMetricName, jsonStringify } from './formatters';
import { ComponentConfiguration, MetricsLogItem } from './interfaces';

const oneTimeMetrics = new Set<string>();

// In case we need to override the theme for VR.
let theme = '';
function setTheme(newTheme: string) {
  theme = newTheme;
}

export class Metrics {
  readonly source: string;
  readonly packageVersion: string;

  private clog = new CLogClient();
  private panorama = new PanoramaClient();

  constructor(source: string, packageVersion: string) {
    this.source = source;
    this.packageVersion = packageVersion;
  }

  initMetrics(theme: string) {
    setTheme(theme);
  }

  /**
   * Calls Console Platform's client logging JS API with provided metric name, value, and detail.
   * Does nothing if Console Platform client logging JS is not present in page.
   */
  sendMetric(metricName: string, value: number, detail?: string): void {
    if (!theme) {
      // Metrics need to be initialized first (initMetrics)
      console.error('Metrics need to be initialized first.');
      return;
    }

    this.clog.sendMetric(metricName, value, detail);
  }

  /**
   * Calls Console Platform's client v2 logging JS API with provided metric name and detail.
   * Does nothing if Console Platform client logging JS is not present in page.
   */
  sendPanoramaMetric(metric: MetricsV2EventItem): void {
    this.panorama.sendMetric(metric);
  }

  sendMetricObject(metric: MetricsLogItem, value: number): void {
    this.sendMetric(buildMetricName(metric, theme), value, buildMetricDetail(metric, theme));
  }

  sendMetricObjectOnce(metric: MetricsLogItem, value: number): void {
    const metricKey = jsonStringify(metric);
    if (!oneTimeMetrics.has(metricKey)) {
      this.sendMetricObject(metric, value);
      oneTimeMetrics.add(metricKey);
    }
  }

  /*
   * Calls Console Platform's client logging only the first time the provided metricName is used.
   * Subsequent calls with the same metricName are ignored.
   */
  sendMetricOnce(metricName: string, value: number, detail?: string): void {
    if (!oneTimeMetrics.has(metricName)) {
      this.sendMetric(metricName, value, detail);
      oneTimeMetrics.add(metricName);
    }
  }

  /*
   * Reports a metric value 1 to Console Platform's client logging service to indicate that the
   * component was loaded. The component load event will only be reported as used to client logging
   * service once per page view.
   */
  logComponentsLoaded() {
    this.sendMetricObjectOnce({ source: this.source, action: 'loaded', version: this.packageVersion }, 1);
  }

  /*
   * Reports a metric value 1 to Console Platform's client logging service to indicate that the
   * component was used in the page.  A component will only be reported as used to client logging
   * service once per page view.
   */
  logComponentUsed(componentName: string, configuration: ComponentConfiguration) {
    this.sendMetricObjectOnce(
      {
        source: componentName,
        action: 'used',
        version: this.packageVersion,
        configuration,
      },
      1
    );
  }
}

export function clearOneTimeMetricsCache(): void {
  oneTimeMetrics.clear();
}

export class MetricsTestHelper {
  resetOneTimeMetricsCache = clearOneTimeMetricsCache;
}
