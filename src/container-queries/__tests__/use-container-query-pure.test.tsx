// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { ContainerQueryEntry } from '../interfaces';
import useContainerQuery from '../use-container-query';

function TestComponent({ mapFn = () => '' }: { mapFn?: (entry: ContainerQueryEntry) => string }) {
  const [value, ref] = useContainerQuery(mapFn);
  return <div ref={ref} data-testid="test" data-value={value} />;
}

test('should work in JSDOM environment without any mocks', () => {
  // making sure this API does not exist
  expect(typeof ResizeObserver).toBe('undefined');
  const mapFn = jest.fn(() => '');
  const component = render(<TestComponent mapFn={mapFn} />);
  expect(mapFn).toHaveBeenCalledWith(
    {
      target: component.getByTestId('test'),
      contentBoxWidth: 0,
      contentBoxHeight: 0,
      borderBoxWidth: 0,
      borderBoxHeight: 0,
    },
    null
  );
});
