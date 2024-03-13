// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from 'react';
import { ComponentConfiguration } from './component-metrics';

export const COMPONENT_METADATA_KEY = '__awsuiMetadata__';

interface AwsUiMetadata {
  name: string;
  version: string;
  analytics?: ComponentConfiguration['analytics'];
}

interface HTMLMetadataElement extends HTMLElement {
  [COMPONENT_METADATA_KEY]: AwsUiMetadata;
}

export function useComponentMetadata<T = any>(
  componentName: string,
  packageVersion: string,
  config?: ComponentConfiguration
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (elementRef.current) {
      const node = elementRef.current as unknown as HTMLMetadataElement;
      const metadata: AwsUiMetadata = {
        name: componentName,
        version: packageVersion,
      };

      // Only add analytics property to metadata if analytics property is non-empty
      if (config?.analytics && Object.keys(config.analytics).length > 0) {
        metadata.analytics = config.analytics;
      }

      Object.freeze(metadata);
      Object.defineProperty(node, COMPONENT_METADATA_KEY, { value: metadata, writable: false, configurable: true });
    }
  });

  return elementRef;
}
