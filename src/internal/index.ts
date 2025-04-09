// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export { useComponentMetadata, COMPONENT_METADATA_KEY } from './base-component/component-metadata.js';
export { useComponentMetrics, ComponentConfiguration } from './base-component/component-metrics.js';
export { initAwsUiVersions } from './base-component/init-awsui-versions.js';
export { useResizeObserver } from './container-queries/use-resize-observer.js';
export { Metrics } from './metrics.js';
export { createSingletonHandler, createSingletonState, UseSingleton } from './singleton-handler/index.js';
export { useStableCallback } from './stable-callback/index.js';
export {
  isMotionDisabled,
  useCurrentMode,
  useDensityMode,
  useReducedMotion,
  useRuntimeVisualRefresh,
} from './visual-mode/index.js';
export { isDevelopment } from './is-development.js';
export { warnOnce, clearMessageCache } from './logging.js';
export {
  getIsRtl,
  getOffsetInlineStart,
  getScrollInlineStart,
  getLogicalClientX,
  getLogicalBoundingClientRect,
  getLogicalPageX,
} from './direction/index.js';
export { useFocusVisible } from './focus-visible/index.js';
export { KeyCode, isModifierKey } from './keycode.js';
export { getGlobalFlag } from './global-flags/index.js';
export {
  SingleTabStopNavigationAPI,
  SingleTabStopNavigationProvider,
  useSingleTabStopNavigation,
} from './single-tab-stop/index.js';
export { isFocusable, getAllFocusables, getFirstFocusable, getLastFocusable } from './focus-lock-utils/utils.js';
export { default as handleKey } from './utils/handle-key.js';
export { default as circleIndex } from './utils/circle-index.js';
