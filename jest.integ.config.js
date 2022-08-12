// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const os = require('os');

module.exports = {
  verbose: true,
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.integ.json',
    },
  },
  testTimeout: 60_000, // 1min
  maxWorkers: os.cpus().length,
  globalSetup: '<rootDir>/jest/global-setup.js',
  globalTeardown: '<rootDir>/jest/global-teardown.js',
  setupFilesAfterEnv: ['<rootDir>/jest/integ-setup.js'],
  moduleFileExtensions: ['js', 'ts'],
  testRegex: '(/(__integ__)/.*(\\.|/)test)\\.[jt]sx?$',
  preset: 'ts-jest',
};
