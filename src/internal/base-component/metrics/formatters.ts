// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MetricDetail, MetricsLogItem } from './interfaces.js';

declare const AWSUI_METRIC_ORIGIN: string | undefined;

// React is the only framework we're using.
const framework = 'react';

export function buildMetricDetail({ source, action, version, configuration }: MetricsLogItem, theme: string): string {
  const metricOrigin = typeof AWSUI_METRIC_ORIGIN !== 'undefined' ? AWSUI_METRIC_ORIGIN : 'main';
  const detailObject: MetricDetail = {
    o: metricOrigin,
    s: source,
    t: theme,
    a: action,
    f: framework,
    v: formatMajorVersionForMetricDetail(version),
    c: configuration as MetricDetail['c'],
  };
  return jsonStringify(detailObject);
}

export function jsonStringify(detailObject: any) {
  return JSON.stringify(detailObject, detailSerializer);
}

function detailSerializer(key: string, value: unknown) {
  // Report NaN and Infinity as strings instead of `null` (default behavior)
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return `${value}`;
  }
  return value;
}

export function buildMetricName({ source, version }: MetricsLogItem, theme: string): string {
  return ['awsui', source, `${formatVersionForMetricName(theme, version)}`].join('_');
}

export function formatMajorVersionForMetricDetail(version: string) {
  return version.replace(/\s/g, '');
}

export function formatVersionForMetricName(theme: string, version: string) {
  return `${theme.charAt(0)}${getMajorVersion(version).replace('.', '')}`;
}

function getMajorVersion(versionString: string): string {
  const majorVersionMatch = versionString.match(/^(\d+\.\d+)/);
  return majorVersionMatch ? majorVersionMatch[1] : '';
}
