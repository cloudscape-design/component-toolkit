// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AnalyticsElement, Handler } from '../interfaces';
import { findUp } from '../utils/browser';
import { getSubStepName } from '../utils/funnel';
import { FunnelSubstep } from '../funnel';

export const mount: Handler = event => {
  // Ignore if container is nested in another container
  if (findUp('Container', event.target)) {
    return;
  }

  const element = event.target as AnalyticsElement;
  const name = getSubStepName(event.target) || 'Unknown Substep';
  const substep = new FunnelSubstep(element, { name });

  element.__analytics__ = substep;
  element.setAttribute('data-analytics-node', 'substep');
};

export const unmount: Handler = event => {
  const substep = (event.target as AnalyticsElement).__analytics__ as FunnelSubstep;
  if (!substep) {
    return;
  }

  substep.scope?.substeps.splice(substep.scope.substeps.indexOf(substep), 1);
};
