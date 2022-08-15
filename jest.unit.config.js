// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const merge = require('lodash/merge');
const tsPreset = require('ts-jest/jest-preset');
const cloudscapePreset = require('@cloudscape-design/jest-preset/jest-preset');

module.exports = merge({}, tsPreset, cloudscapePreset, {
  verbose: true,
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: ['__tests__', '__integ__', '<rootDir>/test-pages'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.unit.json',
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest/unit-setup.js'],
  testRegex: '(/__tests__/.*(\\.|/)test)\\.[jt]sx?$',
});
