// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { useComponentMetadata, COMPONENT_METADATA_KEY } from '../component-metadata';

test('should attach readonly metadata to the returned root DOM node', () => {
  function TestComponent() {
    const ref = useComponentMetadata('test-component', '3.0.0');
    return <div ref={ref}>Test</div>;
  }

  const { container } = render(<TestComponent />);
  const rootNode: any = container.firstChild;

  expect(rootNode[COMPONENT_METADATA_KEY]).toEqual({ name: 'test-component', version: '3.0.0' });
  expect(Object.isFrozen(rootNode[COMPONENT_METADATA_KEY])).toBe(true);
});

test('should include analytics property when provided', () => {
  function TestComponent() {
    const ref = useComponentMetadata('test-component', '3.0.0', {
      instanceIdentifier: '123',
      errorContext: 'some.error',
    });
    return <div ref={ref}>Test</div>;
  }

  const { container } = render(<TestComponent />);
  const rootNode: any = container.firstChild;

  expect(rootNode[COMPONENT_METADATA_KEY]).toEqual({
    name: 'test-component',
    version: '3.0.0',
    analytics: { instanceIdentifier: '123', errorContext: 'some.error' },
  });
  expect(Object.isFrozen(rootNode[COMPONENT_METADATA_KEY])).toBe(true);
});
