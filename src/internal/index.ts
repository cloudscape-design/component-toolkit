// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export { useComponentMetadata, COMPONENT_METADATA_KEY } from './base-component/component-metadata';
export { useComponentMetrics, ComponentConfiguration } from './base-component/component-metrics';
export { initAwsUiVersions } from './base-component/init-awsui-versions';
export { useResizeObserver } from './container-queries/use-resize-observer';
export { Metrics } from './metrics';
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
export {
  getIsRtl,
  getOffsetInlineStart,
  getScrollInlineStart,
  getLogicalClientX,
  getLogicalBoundingClientRect,
  getLogicalPageX,
} from './direction';
export { useFocusVisible } from './focus-visible';
export { KeyCode, isModifierKey } from './keycode';
export { getGlobalFlag } from './global-flags';
export {
  SingleTabStopNavigationAPI,
  SingleTabStopNavigationProvider,
  useSingleTabStopNavigation,
} from './single-tab-stop';
export { isFocusable, getAllFocusables, getFirstFocusable, getLastFocusable } from './focus-lock-utils/utils';
export { default as handleKey } from './utils/handle-key';
export { default as circleIndex } from './utils/circle-index';
export { default as Portal, PortalProps } from './portal';
export { useMergeRefs } from './use-merge-refs';
export { useRandomId, useUniqueId } from './use-unique-id';
export { ReactiveStore, ReadonlyReactiveStore, useReaction, useSelector } from './reactive-store';
