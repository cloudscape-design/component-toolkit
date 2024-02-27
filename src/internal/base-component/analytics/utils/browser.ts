// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AwsUiNode } from '../interfaces';

const isAwsUiNode = (node: HTMLElement) => '__awsuiMetadata__' in node;

export function findUp(componentName: string, element: HTMLElement): HTMLElement | null {
  if (!element.parentNode) {
    return null;
  }

  if (isAwsUiNode(element)) {
    if ((element as AwsUiNode).__awsuiMetadata__.name === componentName) {
      return element;
    }

    if (element.dataset.awsuiReferrerId) {
      const referrer = document.getElementById(element.dataset.awsuiReferrerId) as HTMLElement;
      if (referrer) {
        return findUp(componentName, referrer);
      }
    }
  }

  return findUp(componentName, element.parentNode as HTMLElement);
}

export function findDown(componentName: string, element: HTMLElement): HTMLElement | null {
  if (isAwsUiNode(element) && (element as AwsUiNode).__awsuiMetadata__.name === componentName) {
    return element;
  }

  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    const result = findDown(componentName, child as HTMLElement);
    if (result) {
      return result;
    }
  }

  return null;
}

export function isInComponent(element: HTMLElement, componentName: string): boolean {
  return !!findUp(componentName, element);
}
