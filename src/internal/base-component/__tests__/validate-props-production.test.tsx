// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { validateProps } from '../../../../lib/internal/base-component/validate-props';
import { isDevelopment } from '../../../../lib/internal/is-development';

jest.mock('../../../../lib/internal/is-development', () => ({ isDevelopment: false }));

test('does nothing in production builds', () => {
  expect(isDevelopment).toBe(false);
  expect(() => validateProps('TestComponent', { variant: 'foo' }, ['variant'], {})).not.toThrow();
});
