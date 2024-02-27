// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';
import { ComponentConfiguration } from './component-metrics';

export const COMPONENT_METADATA_KEY = '__awsuiMetadata__';

export interface AwsUiMetadata {
  name: string;
  version: string;
  props?: ComponentConfiguration['props'];
}

interface HTMLMetadataElement extends HTMLElement {
  [COMPONENT_METADATA_KEY]: AwsUiMetadata;
}

export function useComponentMetadata<T = any>(
  elementRef: React.MutableRefObject<T | null>,
  componentName: string,
  packageVersion: string,
  config?: ComponentConfiguration
) {
  useEffect(() => {
    if (elementRef.current) {
      const node = elementRef.current as unknown as HTMLMetadataElement;
      const metadata: AwsUiMetadata = { name: componentName, version: packageVersion, props: config?.props };

      Object.freeze(metadata);
      Object.defineProperty(node, COMPONENT_METADATA_KEY, { value: metadata, writable: false, configurable: true });
    }
  });
}
