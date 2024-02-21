// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AnalyticsElement, Handler } from '../interfaces';
import { isInComponent } from '../utils/browser';
import { getSubStepName } from '../utils/funnel';
import { FunnelSubstep } from '../funnel';

export const mount: Handler = event => {
  // Ignore if container is nested in another container
  if (isInComponent(event.target, 'Container') || isInComponent(event.target, 'ExpandableSection')) {
    return;
  }

  const AnalyticsElement = event.target as AnalyticsElement;
  const substep = new FunnelSubstep({
    name: getSubStepName(event.target) || 'Unknown Substep',
  });

  AnalyticsElement.__analytics__ = substep;
  AnalyticsElement.setAttribute('data-analytics-node', 'substep');
};

export const unmount: Handler = () => {
  // const funnel = getFunnelFromParentNode(event.target);
  // if (!funnel) {
  //   return;
  // }
  // funnel.activeStep?.unregisterSubStep(event.target);
};
