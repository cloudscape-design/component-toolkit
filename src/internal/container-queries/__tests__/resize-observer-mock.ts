// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Mock ResizeObserver for Jest tests
 *
 * This module provides a mock implementation of the native ResizeObserver API
 * for use in Jest test environments where ResizeObserver may not be available.
 */

const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

// Create the ResizeObserver mock constructor
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

// Mock the prototype methods for backward compatibility with tests that access prototype
Object.defineProperty(global.ResizeObserver, 'prototype', {
  value: {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  },
  writable: false,
});

/**
 * Mock getBoundingClientRect to return dimensions based on CSS styles
 *
 * In JSDOM test environments, getBoundingClientRect() returns all zeros because
 * JSDOM doesn't perform actual layout calculations. This mock extracts width/height
 * from computed CSS styles to provide realistic dimensions for ResizeObserver tests.
 *
 * Only mock in browser environments (not SSR tests where Element is undefined).
 */
if (typeof Element !== 'undefined') {
  Element.prototype.getBoundingClientRect = jest.fn(function () {
    const style = window.getComputedStyle(this);
    const width = parseFloat(style.width) || 0;
    const height = parseFloat(style.height) || 0;

    return {
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  });
}

// Export the mock functions for test access if needed
module.exports = {
  mockObserve,
  mockUnobserve,
  mockDisconnect,
};
