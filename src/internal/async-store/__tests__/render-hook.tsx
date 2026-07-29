// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';

export { act } from '@testing-library/react';

/**
 * Minimal port of `renderHook` from @testing-library/react (native version needs v13+).
 * Supports the no-options usage exercised by the async-store tests.
 */
export function renderHook<Result>(renderCallback: () => Result) {
  const result = React.createRef<Result>() as React.MutableRefObject<Result>;

  function TestComponent() {
    const pendingResult = renderCallback();

    React.useEffect(() => {
      result.current = pendingResult;
    });

    return null;
  }

  const { rerender, unmount } = render(<TestComponent />);

  return { result, rerender, unmount };
}
