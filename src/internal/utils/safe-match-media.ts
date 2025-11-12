// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function safeMatchMedia(element: HTMLElement, query: string) {
  try {
    const targetWindow = element.ownerDocument?.defaultView ?? window;
    return targetWindow.matchMedia?.(query).matches ?? false;
  } catch (error) {
    console.warn(error);
    return false;
  }
}
