// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PointerEvent as ReactPointerEvent } from 'react';

export function getIsRtl(element: null | HTMLElement | SVGElement): boolean {
  if (!element) {
    return false;
  }
  return getComputedStyle(element).direction === 'rtl';
}

/**
 * The offsetLeft property is relative to the left of the offsetParent
 * regardless of the document direction. This function returns the
 * offsetLeft value or computes the Rtl equivalent of this value
 * from the right of the offsetParent.
 */
export function getOffsetInlineStart(element: HTMLElement) {
  const offsetParentWidth = element.offsetParent?.clientWidth ?? 0;
  return getIsRtl(element) ? offsetParentWidth - element.offsetWidth - element.offsetLeft : element.offsetLeft;
}

/**
 * The scrollLeft value returned by the browser will be a negative number
 * if the direction is RTL. This function returns a positive value for direction
 * independent of scroll computations. Additionally, the scrollLeft value can be
 * a decimal value on systems using display scaling requiring the floor and ceiling calls.
 */
export function getScrollInlineStart(element: HTMLElement) {
  return getIsRtl(element) ? Math.floor(element.scrollLeft) * -1 : Math.ceil(element.scrollLeft);
}

/**
 * The clientX value is computed from the top left corner of the document regardless
 * of the document diretion. This function returns the clientX value or computes the
 * Rtl equivalent relative to the top right corner of the document in order for
 * computations to yield the same result in both element directions.
 */
export function getLogicalClientX(event: PointerEvent | ReactPointerEvent<unknown>, IsRtl: boolean) {
  return IsRtl ? document.documentElement.clientWidth - event.clientX : event.clientX;
}

/**
 * The getBoundingClientRect() function returns values relative to the top left
 * corner of the document regardless of document direction. The left/right position
 * will be transformed to insetInlineStart based on element direction in order to
 * support direction agnostic position computation.
 */
export function getLogicalBoundingClientRect(element: HTMLElement | SVGElement) {
  const boundingClientRect = element.getBoundingClientRect();

  const blockSize = boundingClientRect.height;
  const inlineSize = boundingClientRect.width;
  const insetBlockStart = boundingClientRect.top;
  const insetBlockEnd = boundingClientRect.bottom;
  const insetInlineStart = getIsRtl(element)
    ? document.documentElement.clientWidth - boundingClientRect.right
    : boundingClientRect.left;
  const insetInlineEnd = insetInlineStart + inlineSize;

  return {
    blockSize,
    inlineSize,
    insetBlockStart,
    insetBlockEnd,
    insetInlineStart,
    insetInlineEnd,
  };
}

/**
 * The pageX position needs to be converted so it is relative to the right of
 * the document in order for computations to yield the same result in both
 * element directions.
 */
export function getLogicalPageX(event: MouseEvent) {
  return event.target instanceof HTMLElement && getIsRtl(event.target)
    ? document.documentElement.clientWidth - event.pageX
    : event.pageX;
}
