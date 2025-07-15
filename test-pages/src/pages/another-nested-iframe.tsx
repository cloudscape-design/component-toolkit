// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { activateAnalyticsMetadata, getAnalyticsMetadataAttribute } from '../../../src/internal/analytics-metadata/';

export default function NestedIFrame() {
  activateAnalyticsMetadata(true);
  return (
    <>
      <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentThree' } })}>
        <div id="sub-sub-target">inside iframe inside iframe</div>
        <div id="id:portal-2"></div>
      </div>
      <div data-awsui-referrer-id="id:portal-2">
        <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentThreeInPortal' } })}> </div>
      </div>
    </>
  );
}
