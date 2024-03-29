// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { configure } = require('@cloudscape-design/browser-test-tools/use-browser');

configure({
  browserName: 'ChromeHeadlessIntegration',
  browserCreatorOptions: {
    seleniumUrl: 'http://localhost:9515',
  },
  webdriverOptions: {
    baseUrl: 'http://localhost:3000',
  },
});
