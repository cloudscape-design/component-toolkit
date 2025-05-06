// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from 'react';
import { AnalyticsMetadata } from './metrics/interfaces';

export const COMPONENT_METADATA_KEY = '__awsuiMetadata__';

interface PackageMetadata {
  packageName?: string;
  version: string;
  theme?: string;
}

interface ComponentMetadata extends PackageMetadata {
  name: string;
  analytics?: AnalyticsMetadata;
}

interface HTMLMetadataElement extends HTMLElement {
  [COMPONENT_METADATA_KEY]: ComponentMetadata;
}

export function useComponentMetadata<T = any>(
  componentName: string,
  packageMetadata: PackageMetadata | string,
  analyticsMetadata?: AnalyticsMetadata
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (elementRef.current) {
      const pkgMetadata = typeof packageMetadata === 'string' ? { version: packageMetadata } : packageMetadata;

      const node = elementRef.current as unknown as HTMLMetadataElement;
      const metadata: ComponentMetadata = {
        ...pkgMetadata,
        name: componentName,
      };

      // Only add analytics property to metadata if analytics property is non-empty
      if (analyticsMetadata && Object.keys(analyticsMetadata).length > 0) {
        metadata.analytics = analyticsMetadata;
      }

      Object.freeze(metadata);
      Object.defineProperty(node, COMPONENT_METADATA_KEY, { value: metadata, writable: false, configurable: true });
    }
  });

  return elementRef;
}
