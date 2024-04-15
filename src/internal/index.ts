// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export { useComponentMetadata, COMPONENT_METADATA_KEY, AnalyticsMetadata } from './base-component/component-metadata';
export { useComponentMetrics, ComponentConfiguration } from './base-component/component-metrics';
export { initAwsUiVersions } from './base-component/init-awsui-versions';
export { Metrics } from './base-component/metrics/metrics';
export { useResizeObserver } from './container-queries/use-resize-observer';
export { createSingletonHandler, createSingletonState, UseSingleton } from './singleton-handler';
export { useStableCallback } from './stable-callback';
export {
  isMotionDisabled,
  useCurrentMode,
  useDensityMode,
  useReducedMotion,
  useRuntimeVisualRefresh,
} from './visual-mode';
export { isDevelopment } from './is-development';
export { warnOnce, clearMessageCache } from './logging';
