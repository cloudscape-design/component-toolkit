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
} from '../attributes';

test('getAnalyticsMetadataAttribute should add data-awsui-analytics attribute', () => {
  const metadata = { component: { name: 'whatever' } };
  const { container } = render(<div {...getAnalyticsMetadataAttribute(metadata)} />);
  expect((container.firstElementChild as HTMLElement).dataset[METADATA_DATA_ATTRIBUTE]).toEqual(
    JSON.stringify(metadata)
  );
});

test('copyAnalyticsMetadataAttribute should select only data-awsui-analytics attribute from a list of props', () => {
  const metadata = { component: { name: 'whatever' } };
  const props = { ...getAnalyticsMetadataAttribute(metadata), className: 'test-class' };
  const { container } = render(<div {...copyAnalyticsMetadataAttribute(props)} />);
  expect((container.firstElementChild as HTMLElement).dataset[METADATA_DATA_ATTRIBUTE]).toEqual(
    JSON.stringify(metadata)
  );
  expect((container.firstElementChild as HTMLElement).classList.contains('test-class')).toBe(false);
});

test('getAnalyticsLabelAttribute should add data-awsui-analytics-label attribute', () => {
  const labelIdentifier = 'label-id';
  const { container } = render(<div {...getAnalyticsLabelAttribute(labelIdentifier)} />);
  expect((container.firstElementChild as HTMLElement).dataset[LABEL_DATA_ATTRIBUTE]).toEqual(labelIdentifier);
});
