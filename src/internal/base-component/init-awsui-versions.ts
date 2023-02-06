// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// not using `declare global {}` to avoid polluting customers' typings with this info
interface CustomWindow extends Window {
  awsuiVersions?: { [source: string]: string[] };
}
declare const window: CustomWindow | undefined;

// expose version info, so it can be checked using the browser devtools
export function initAwsUiVersions(source: string, packageVersion: string) {
  if (typeof window !== 'undefined') {
    if (!window.awsuiVersions) {
      window.awsuiVersions = {};
    }
    if (!window.awsuiVersions[source]) {
      window.awsuiVersions[source] = [];
    }
    window.awsuiVersions[source].push(packageVersion);
  }
}
