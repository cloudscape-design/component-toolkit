// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { isHTMLElement } from './element-types';

/**
 * Checks if the current element or any of its parent is matched with `test` function.
 *
 * @example
 * Check if there is an ancestor with a CSS class matching regex
 * ```
 * const matchContext = (element) => element.className.match(/my-context-([\w-]+)/)
 * const contextElement = findUpUntil(currentElement, matchContext)
 * ```
 *
 * @param from Element to search from
 * @param test Returns `true` if the given element satisfies the search criteria
 * @returns First matched element or `null`
 */
export default function findUpUntil(from: HTMLElement, test: (element: HTMLElement) => boolean): HTMLElement | null {
  let current: HTMLElement | null = from;
  while (current && !test(current)) {
    current = current.parentElement;
    // If a component is used within an svg (i.e. as foreignObject), then it will
    // have some ancestor nodes that are SVGElement. We want to skip those,
    // as they have very different properties to HTMLElements.
    while (current && !isHTMLElement(current)) {
      current = (current as Element).parentElement;
    }
  }
  return current;
}
