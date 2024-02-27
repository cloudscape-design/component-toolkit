// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Funnel, FunnelStep, FunnelSubstep } from './funnel';
import { AnalyticsElement, FunnelSubStepConfig } from './interfaces';

const elementCache = new WeakMap<HTMLElement, Funnel | FunnelStep | FunnelSubstep>();

export function createFunnelSubstep(element: AnalyticsElement, config: FunnelSubStepConfig) {
  console.log('debuggger');
  const funnelSubStep = elementCache.get(element) || new FunnelSubstep(element, config);
  elementCache.set(element, funnelSubStep);
  return funnelSubStep;
}
