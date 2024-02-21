// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Handler } from '../interfaces';
import { getFunnelFromParentNode } from '../helpers';

export const error: Handler = event => {
  const funnel = getFunnelFromParentNode(event.target);
  if (!funnel) {
    console.warn('Could not find funnel for formfield error');
    return;
  }

  const { fieldLabel, fieldError } = event.detail.detail as any;
  // funnel.activeStep?.activeSubstep?.error();

  console.log('funnelFieldError', fieldLabel, fieldError);
};

export const errorClear: Handler = event => {
  const funnel = getFunnelFromParentNode(event.target);
  if (!funnel) {
    console.warn('Could not find funnel for formfield error clear');
    return;
  }

  const { fieldLabel } = event.detail.detail as any;
  // funnel.activeStep?.activeSubstep?.clearError();

  console.log('funnelFieldErrorClear', fieldLabel);
};
