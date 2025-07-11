// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { activateAnalyticsMetadata, getAnalyticsMetadataAttribute } from '../../../src/internal/analytics-metadata/';

export default function NestedIFrame() {
  activateAnalyticsMetadata(true);
  return (
    <>
      <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentTwo' } })}>
        <div>inside iframe</div>
        <div id="sub-target">
          <iframe id="iframe-2" src="/another-nested-iframe" />
          <div id="id:portal-1"></div>
        </div>
      </div>
      <div data-awsui-referrer-id="id:portal-1">
        <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentTwoInPortal' } })}> </div>
      </div>
    </>
  );
}
