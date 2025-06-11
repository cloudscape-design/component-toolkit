// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';

import { useUniqueId, useRandomId } from '../index';

function DemoRandomIdComponent() {
  const id = useRandomId();
  return <div>{id}</div>;
}

function DemoUniqueIdComponent({ prefix }: { prefix: string }) {
  const id = useUniqueId(prefix);
  return <div>{id}</div>;
}

it('generates random ID per component', () => {
  const component1 = render(<DemoRandomIdComponent />);
  const textContent1 = component1.container.textContent;

  const component2 = render(<DemoRandomIdComponent />);
  const textContent2 = component2.container.textContent;

  expect(textContent1).not.toBe('');
  expect(textContent1).not.toBe(textContent2);

  component1.rerender(<DemoRandomIdComponent />);
  expect(component1.container.textContent).toBe(textContent1);
});

it('creates unique ID with given prefix', () => {
  const component = render(<DemoUniqueIdComponent prefix="prefix-" />);

  expect(component.container.textContent).toContain('prefix-');
});
