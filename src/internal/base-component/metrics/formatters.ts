// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PackageSettings, ComponentMetricDetail, JSONObject } from './interfaces.js';

declare const AWSUI_METRIC_ORIGIN: string | undefined;

export function buildMetricDetail(detail: JSONObject, context: PackageSettings): string {
  const metricOrigin = typeof AWSUI_METRIC_ORIGIN !== 'undefined' ? AWSUI_METRIC_ORIGIN : 'main';
  const detailObject = {
    o: metricOrigin,
    t: context.theme,
    // React is the only framework we're using.
    f: 'react',
    // Remove spaces from the version string for compactness
    v: context.packageVersion.replace(/\s/g, ''),
    ...detail,
  };
  return jsonStringify(detailObject);
}

export function buildComponentMetricDetail(
  { componentName, action, configuration, packageSource }: ComponentMetricDetail,
  context: PackageSettings
): string {
  return buildMetricDetail(
    {
      a: action,
      s: componentName,
      p: packageSource,
      c: configuration as JSONObject | undefined,
    },
    context
  );
}

function jsonStringify(detailObject: any) {
  return JSON.stringify(detailObject, detailSerializer);
}

function detailSerializer(key: string, value: unknown) {
  // Report NaN and Infinity as strings instead of `null` (default behavior)
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return `${value}`;
  }
  return value;
}

export function getMajorVersion(versionString: string): string {
  const majorVersionMatch = versionString.match(/^(\d+\.\d+)/);
  return majorVersionMatch ? majorVersionMatch[1].replace('.', '') : '';
}
