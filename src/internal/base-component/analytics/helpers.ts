// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getParentFunnelNode } from './utils/browser';
import { AnalyticsElement } from './interfaces';
import { Funnel, FunnelSubstep } from './funnel';

export function getFunnelFromParentNode(element: HTMLElement) {
  const parentFunnelNode = getParentFunnelNode(element);
  if (!parentFunnelNode) {
    return null;
  }

  return (parentFunnelNode as AnalyticsElement).__analytics__ as Funnel;
}

export function getFunnelSubstepForElement(element: HTMLElement) {
  const parentSubstep = element.closest('[data-analytics-node="substep"]') as AnalyticsElement;
  return parentSubstep?.__analytics__ as FunnelSubstep;
}

export function kebabCaseToCamelCase(str: string) {
  if (!str.includes('-')) {
    return str;
  }

  const camelCase = str
    .split('-')
    .map((word, index) => {
      // Capitalize all words except the first one
      if (index === 0) {
        return word.toLowerCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
  return camelCase;
}
