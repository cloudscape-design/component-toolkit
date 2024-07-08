// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GeneratedAnalyticsMetadataFragment } from './interfaces';

export const METADATA_DATA_ATTRIBUTE = 'awsuiAnalytics';
export const METADATA_ATTRIBUTE = `data-awsui-analytics`;
export const LABEL_DATA_ATTRIBUTE = 'awsuiAnalyticsLabel';
const LABEL_ATTRIBUTE = 'data-awsui-analytics-label';

export const getAnalyticsMetadataAttribute = (metadata: GeneratedAnalyticsMetadataFragment) => ({
  [METADATA_ATTRIBUTE]: JSON.stringify(metadata),
});

export const copyAnalyticsMetadataAttribute = (props: any) => ({
  [METADATA_ATTRIBUTE]: props[METADATA_ATTRIBUTE],
});

export const getAnalyticslabelAttribute = (labelIdentifierString: string) => ({
  [LABEL_ATTRIBUTE]: labelIdentifierString,
});
