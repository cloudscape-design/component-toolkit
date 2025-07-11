// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { activateAnalyticsMetadata, getAnalyticsMetadataAttribute } from '../../../src/internal/analytics-metadata/';
import { getComponentsTree } from '../../../src/internal/analytics-metadata/utils';

// Extend the Window interface to include the getComponentsTree property
declare global {
  interface Window {
    getComponentsTree: typeof getComponentsTree;
  }
}

export default function PageWithIFrame() {
  window.getComponentsTree = getComponentsTree;
  activateAnalyticsMetadata(true);
  return (
    <>
      <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentOne' } })}>
        <iframe id="iframe-1" src="/nested-iframe" />
        <iframe src="https://www.amazon.com/" />
      </div>
    </>
  );
}
