// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getVisualTheme } from '../utils/get-visual-theme';
import { useRuntimeVisualRefresh } from '../visual-mode';
import { useComponentMetrics } from './component-metrics';
import { ComponentConfiguration } from './metrics/interfaces';

import { Environment } from './interfaces';

export function createUseTelemetry(environment: Environment) {
  return (componentName: string, config?: ComponentConfiguration) => {
    const isVisualRefresh = environment.alwaysVisualRefresh || useRuntimeVisualRefresh();
    const theme = getVisualTheme(environment.theme, isVisualRefresh);

    useComponentMetrics(
      componentName,
      {
        packageSource: environment.packageSource,
        packageVersion: environment.packageVersion,
        theme,
      },
      config
    );
  };
}
