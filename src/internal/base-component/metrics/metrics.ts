// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CLogClient, PanoramaClient, MetricsV2EventItem } from './log-clients';
import { buildComponentMetricDetail, buildMetricDetail, getMajorVersion } from './formatters';
import { ComponentConfiguration, ComponentMetricDetail, PackageSettings } from './interfaces';

const oneTimeMetrics = new Set<string>();

export class Metrics {
  private readonly context: PackageSettings;
  private readonly clog = new CLogClient();
  private readonly panorama = new PanoramaClient();

  constructor(packageSource: PackageSettings);
  constructor(packageSource: string, packageVersion: string);
  constructor(...args: [PackageSettings] | [string, string]) {
    if (args.length === 1) {
      this.context = args[0];
    } else {
      const [packageSource, packageVersion] = args;
      this.context = { packageSource, packageVersion, theme: 'unknown' };
    }
  }

  private sendComponentMetric(metric: ComponentMetricDetail): void {
    this.sendMetricOnce(
      `awsui_${metric.componentName}_${this.context.theme.charAt(0)}${getMajorVersion(this.context.packageVersion)}`,
      1,
      buildComponentMetricDetail(metric, this.context)
    );
  }

  /*
   * Calls Console Platform's client logging only the first time the provided metricName is used.
   * Subsequent calls with the same metricName are ignored.
   */
  private sendMetricOnce(metricName: string, value: number, detail?: string): void {
    const key = [metricName + value + detail].join('|');
    if (!oneTimeMetrics.has(key)) {
      this.clog.sendMetric(metricName, value, detail);
      oneTimeMetrics.add(key);
    }
  }

  /**
   * Calls Console Platform's client v2 logging JS API with provided metric name and detail.
   * Does nothing if Console Platform client logging JS is not present in page.
   */
  sendPanoramaMetric(metric: MetricsV2EventItem): void {
    this.panorama.sendMetric(metric);
  }

  sendOpsMetricObject(metricName: string, detail: Record<string, string>) {
    this.sendMetricOnce(metricName, 1, buildMetricDetail(detail, this.context));
  }

  sendOpsMetricValue(metricName: string, value: number) {
    this.sendMetricOnce(metricName, value);
  }

  /*
   * Reports a metric value 1 to Console Platform's client logging service to indicate that the
   * component was loaded. The component load event will only be reported as used to client logging
   * service once per page view.
   */
  logComponentsLoaded() {
    this.sendComponentMetric({ componentName: this.context.packageSource, action: 'loaded' });
  }

  /*
   * Reports a metric value 1 to Console Platform's client logging service to indicate that the
   * component was used in the page.  A component will only be reported as used to client logging
   * service once per page view.
   */
  logComponentUsed(componentName: string, configuration: ComponentConfiguration) {
    this.sendComponentMetric({
      action: 'used',
      componentName,
      configuration,
    });
  }
}

export function clearOneTimeMetricsCache(): void {
  oneTimeMetrics.clear();
}
