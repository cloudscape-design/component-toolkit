// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

require('@testing-library/jest-dom');
const { cleanup } = require('@testing-library/react');
afterEach(cleanup);

// Import ResizeObserver and getBoundingClientRect mocks
require('./resize-observer-mock');
