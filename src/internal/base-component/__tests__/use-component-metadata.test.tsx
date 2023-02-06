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

  expect(rootNode[COMPONENT_METADATA_KEY]?.name).toBe('test-component');
  expect(rootNode[COMPONENT_METADATA_KEY]?.version).toBe('3.0.0');

  expect(() => {
    rootNode[COMPONENT_METADATA_KEY]!.name = 'changed name';
  }).toThrow(`Cannot assign to read only property 'name' of object '#<Object>'`);
  expect(() => {
    rootNode[COMPONENT_METADATA_KEY]!.version = 'changed version';
  }).toThrow(`Cannot assign to read only property 'version' of object '#<Object>'`);

  expect(rootNode[COMPONENT_METADATA_KEY]?.name).toBe('test-component');
  expect(rootNode[COMPONENT_METADATA_KEY]?.version).toBe('3.0.0');
});
