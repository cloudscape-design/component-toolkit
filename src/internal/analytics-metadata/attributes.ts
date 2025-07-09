// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GeneratedAnalyticsMetadataFragment } from './interfaces';
import { getGlobalFlag } from '../global-flags';

export const METADATA_DATA_ATTRIBUTE = 'awsuiAnalytics';
export const METADATA_ATTRIBUTE = 'data-awsui-analytics';
export const LABEL_DATA_ATTRIBUTE = 'awsuiAnalyticsLabel';
export const REFERRER_DATA_ATTRIBUTE = 'awsuiReferrerId';
export const REFERRER_ATTRIBUTE = 'data-awsui-referrer-id';
const LABEL_ATTRIBUTE = 'data-awsui-analytics-label';

let activated = getGlobalFlag('analyticsMetadata');

export const activateAnalyticsMetadata = (active: boolean) => {
  activated = active;
};

export const getAnalyticsMetadataAttribute = (metadata: GeneratedAnalyticsMetadataFragment) =>
  activated
    ? {
        [METADATA_ATTRIBUTE]: JSON.stringify(metadata),
      }
    : {};

export const copyAnalyticsMetadataAttribute = (props: any) =>
  activated
    ? {
        [METADATA_ATTRIBUTE]: props[METADATA_ATTRIBUTE],
      }
    : {};

export const getAnalyticsLabelAttribute = (labelIdentifierString: string) =>
  activated
    ? {
        [LABEL_ATTRIBUTE]: labelIdentifierString,
      }
    : {};
