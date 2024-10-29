// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GeneratedAnalyticsMetadataFragment } from './interfaces';
import { processLabel } from './labels-utils';

export const mergeMetadata = (
  metadata: GeneratedAnalyticsMetadataFragment | null,
  localMetadata: GeneratedAnalyticsMetadataFragment | null
) => {
  const output = merge(metadata, localMetadata);
  if (output.component && output.component.name) {
    output.contexts = [...(output.contexts || []), { type: 'component', detail: output.component }];
    delete output.component;
  }
  return output;
};

export const processMetadata = (node: HTMLElement | null, localMetadata: any): GeneratedAnalyticsMetadataFragment => {
  return Object.keys(localMetadata).reduce((acc: any, key: string) => {
    if (key.toLowerCase().match(/label$/)) {
      acc[key] = processLabel(node, localMetadata[key]);
    } else if (typeof localMetadata[key] !== 'string') {
      acc[key] = processMetadata(node, localMetadata[key]);
    } else {
      acc[key] = localMetadata[key];
    }
    return acc;
  }, {});
};

const isNil = (value: any) => {
  return typeof value === 'undefined' || value === null;
};

export const merge = (inputTarget: any, inputSource: any): any => {
  const merged: any = {};
  const target = inputTarget || {};
  const source = inputSource || {};
  const targetKeys = Object.keys(target);
  const sourceKeys = Object.keys(source);
  const allKeys = new Set([...targetKeys, ...sourceKeys]);
  for (const key of allKeys) {
    if (target[key] && !source[key]) {
      merged[key] = target[key];
    } else if (!target[key] && !isNil(source[key])) {
      merged[key] = source[key];
    } else if (typeof target[key] === 'string') {
      merged[key] = source[key];
    } else {
      merged[key] = merge(target[key], source[key]);
    }
  }
  return JSON.parse(JSON.stringify(merged));
};
