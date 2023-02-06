// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { useComponentMetadata, COMPONENT_METADATA_KEY } from '../component-metadata';

function TestComponent() {
  const ref = useComponentMetadata('test-component', '3.0.0');
  return <div ref={ref}>Test</div>;
}

test('should attach readonly metadata to the returned root DOM node', () => {
  const { container } = render(<TestComponent />);
  const rootNode: any = container.firstChild;

  expect(rootNode[COMPONENT_METADATA_KEY]).toEqual({ name: 'test-component', version: '3.0.0' });
  expect(Object.isFrozen(rootNode[COMPONENT_METADATA_KEY])).toBe(true);
});
