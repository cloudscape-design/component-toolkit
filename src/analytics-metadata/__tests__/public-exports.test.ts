// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as internalApi from '../../internal/analytics-metadata/index';
import * as internalUtils from '../../internal/analytics-metadata/utils';
import * as publicApi from '../index';
import * as publicUtils from '../utils';

const fragment = { component: { name: 'awsui.Test' } };

afterEach(() => {
  publicApi.activateAnalyticsMetadata(false);
});

describe('public analytics-metadata entry point', () => {
  test('exposes the documented named exports', () => {
    expect(Object.keys(publicApi).sort()).toEqual(['activateAnalyticsMetadata', 'getAnalyticsMetadataAttribute']);
    expect(Object.keys(publicUtils).sort()).toEqual(['getComponentsTree', 'getGeneratedAnalyticsMetadata']);
  });

  test('re-exports the same function identities as the internal entry point', () => {
    expect(publicApi.activateAnalyticsMetadata).toBe(internalApi.activateAnalyticsMetadata);
    expect(publicApi.getAnalyticsMetadataAttribute).toBe(internalApi.getAnalyticsMetadataAttribute);
    expect(publicUtils.getGeneratedAnalyticsMetadata).toBe(internalUtils.getGeneratedAnalyticsMetadata);
    expect(publicUtils.getComponentsTree).toBe(internalUtils.getComponentsTree);
  });

  test('shares activation state with the internal entry point', () => {
    publicApi.activateAnalyticsMetadata(true);
    expect(internalApi.getAnalyticsMetadataAttribute(fragment)).toEqual({
      'data-awsui-analytics': JSON.stringify(fragment),
    });

    publicApi.activateAnalyticsMetadata(false);
    expect(internalApi.getAnalyticsMetadataAttribute(fragment)).toEqual({});
  });
});
