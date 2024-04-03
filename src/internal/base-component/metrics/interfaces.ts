// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

type JSONValue = string | number | boolean | undefined;

interface JSONObject {
  [key: string]: JSONObject | JSONValue;
}

export interface PackageSettings {
  packageSource: string;
  packageVersion: string;
  theme: string;
}

export interface ComponentConfiguration {
  props: Record<string, JSONValue>;
  metadata?: Record<string, JSONValue>;
}

export interface MetricsLogItem {
  source: string;
  // Currently logged actions
  // "loaded" – components package loaded
  // "used" – individual component used
  action: 'loaded' | 'used';
  version: string;
  configuration?: ComponentConfiguration;
}

export interface MetricDetail {
  // origin
  o: string;
  // source, e.g. component or package name
  s: string;
  // theme
  t: string;
  // action
  a: string;
  // framework
  f: string;
  // version and git commit
  v: string;
  // component configuration
  c: JSONObject | undefined;
}
