// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { TrackEvent, Handler, AwsUiNode } from '../interfaces';
import { mount as containerMount, unmount as containerUnmount } from './container.handler';

const isContainerVariant = (event: TrackEvent) => {
  const variant = (event.target as AwsUiNode).__awsuiMetadata__.props?.variant;
  return variant === 'container' || variant === 'stacked';
};

export const mount: Handler = event => {
  if (!isContainerVariant(event)) {
    return;
  }

  return containerMount(event);
};

export const unmount: Handler = event => {
  if (!isContainerVariant(event)) {
    return;
  }

  return containerUnmount(event);
};
