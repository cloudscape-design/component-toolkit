// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import {
  getAnalyticsLabelAttribute,
  copyAnalyticsMetadataAttribute,
  getAnalyticsMetadataAttribute,
  METADATA_DATA_ATTRIBUTE,
  LABEL_DATA_ATTRIBUTE,
  activateAnalyticsMetadata,
} from '../attributes';

describe.each([true, false])('With activate analitycs metadata = %s', active => {
  beforeAll(() => {
    activateAnalyticsMetadata(active);
  });

  test('getAnalyticsMetadataAttribute should add data-awsui-analytics attribute', () => {
    const metadata = { component: { name: 'whatever' } };
    const { container } = render(<div {...getAnalyticsMetadataAttribute(metadata)} />);
    if (active) {
      expect((container.firstElementChild as HTMLElement).dataset[METADATA_DATA_ATTRIBUTE]).toEqual(
        JSON.stringify(metadata)
      );
    } else {
      expect((container.firstElementChild as HTMLElement).dataset[METADATA_DATA_ATTRIBUTE]).toBeUndefined();
    }
  });

  test('copyAnalyticsMetadataAttribute should select only data-awsui-analytics attribute from a list of props', () => {
    const metadata = { component: { name: 'whatever' } };
    const props = { ...getAnalyticsMetadataAttribute(metadata), className: 'test-class' };
    const { container } = render(<div {...copyAnalyticsMetadataAttribute(props)} />);
    expect((container.firstElementChild as HTMLElement).classList.contains('test-class')).toBe(false);
    if (active) {
      expect((container.firstElementChild as HTMLElement).dataset[METADATA_DATA_ATTRIBUTE]).toEqual(
        JSON.stringify(metadata)
      );
    } else {
      expect((container.firstElementChild as HTMLElement).dataset[METADATA_DATA_ATTRIBUTE]).toBeUndefined();
    }
  });

  test('getAnalyticsLabelAttribute should add data-awsui-analytics-label attribute', () => {
    const labelIdentifier = 'label-id';
    const { container } = render(<div {...getAnalyticsLabelAttribute(labelIdentifier)} />);
    if (active) {
      expect((container.firstElementChild as HTMLElement).dataset[LABEL_DATA_ATTRIBUTE]).toEqual(labelIdentifier);
    } else {
      expect((container.firstElementChild as HTMLElement).dataset[LABEL_DATA_ATTRIBUTE]).toBeUndefined();
    }
  });
});
