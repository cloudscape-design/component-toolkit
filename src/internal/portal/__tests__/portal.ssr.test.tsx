/**
 * @jest-environment node
 */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Portal from '../index';

// The probe span must be part of the server markup, otherwise it appears as an
// added element during hydration and React discards the whole subtree.
// See https://github.com/cloudscape-design/component-toolkit/pull/214
test('renders the probe span so that server and client markup match', () => {
  const content = renderToStaticMarkup(
    <Portal>
      <p>Hello!</p>
    </Portal>
  );
  expect(content).toBe('<span style="display:none"></span>');
});

test('does not render portal children on the server', () => {
  const content = renderToStaticMarkup(
    <Portal>
      <p>Hello!</p>
    </Portal>
  );
  expect(content).not.toContain('Hello!');
});
