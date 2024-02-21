// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Handler } from '../interfaces';
import { getFunnelFromParentNode, getFunnelSubstepForElement } from '../helpers';

export const mount: Handler = () => {};
export const unmount: Handler = () => {};
export const click: Handler = () => {};

export const focus: Handler = event => {
  const funnel = getFunnelFromParentNode(event.target);
  const funnelSubstep = getFunnelSubstepForElement(event.target);

  if (!funnel || !funnelSubstep) {
    return;
  }

  funnel.activeStep?.setActiveSubstep(funnelSubstep);
};

export const blur: Handler = () => {};
