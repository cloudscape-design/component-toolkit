// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { validateProps } from '../validate-props';
import { isDevelopment } from '../../is-development';

jest.mock('../../is-development', () => ({ isDevelopment: false }));

test('does nothing in production builds', () => {
  expect(isDevelopment).toBe(false);
  expect(() => validateProps('TestComponent', { variant: 'foo' }, ['variant'], {}, 'default')).not.toThrow();
});
