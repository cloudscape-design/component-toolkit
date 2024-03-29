// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef } from 'react';

/**
 * A callback that stays stable between renders even as the dependencies change.
 * Not a recommended React pattern, so it should be used sparingly and only if
 * the callback is used asynchronously (i.e. not used during rendering) and causing
 * clear performance issues.
 *
 * @remarks
 *
 * The implementation ensures the callback cannot be called synchronously. All synchronous calls
 * (during rendering) are ignored.
 *
 * @example
 * Use stable onMouseMove handler
 * ```
 * function Demo({ args }) {
 *   const stableOnMouseMove = useStableCallback((event) => makeAction(event, args))
 *   return <Container onMouseMove={stableOnMouseMove} />
 * }
 * ```
 *
 * @see https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
 *
 * @typeParam Callback The callback to be made stable
 * @returns Stable callback
 */
export function useStableCallback<Callback extends (...args: any[]) => any>(fn: Callback): Callback {
  const ref = useRef<Callback>();

  useEffect(() => {
    ref.current = fn;
  });

  return useCallback((...args: any[]) => ref.current?.apply(undefined, args), []) as Callback;
}
