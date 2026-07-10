// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { isDevelopment } from './is-development.js';

const messageCache = new Set<string>();

export function warnOnce(component: string, message: string): void {
  if (isDevelopment) {
    const warning = `[AwsUi] [${component}] ${message}`;
    if (!messageCache.has(warning)) {
      messageCache.add(warning);
      console.warn(warning);
    }
  }
}

export function clearMessageCache(): void {
  messageCache.clear();
}
