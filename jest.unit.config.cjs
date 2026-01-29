// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const cloudscapePreset = require('@cloudscape-design/jest-preset/jest-preset');
const merge = require('@cloudscape-design/jest-preset/merge');

module.exports = merge({}, cloudscapePreset, {
  verbose: true,
  testEnvironment: 'jsdom',
  collectCoverage: process.env.CI === 'true',
  coveragePathIgnorePatterns: ['__tests__', '__integ__', '<rootDir>/test-pages'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.unit.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest/unit-setup.cjs'],
  testRegex: '(/__tests__/.*(\\.|/)test)\\.[jt]sx?$',
});
