// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Handler } from '../interfaces';
import { getFunnelFromParentNode } from '../helpers';

export const propertyChange: Handler = event => {
  const funnel = getFunnelFromParentNode(event.target);
  if (!funnel) {
    return;
  }

  const { visible } = event.detail.detail as any;
  if (visible === true) {
    funnel.start();
  } else {
    funnel.complete();
  }
};

export const submit: Handler = event => {
  const funnel = getFunnelFromParentNode(event.target);
  if (!funnel) {
    return;
  }

  funnel.submit();
};
