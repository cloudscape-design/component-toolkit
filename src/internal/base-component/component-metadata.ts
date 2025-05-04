// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from 'react';
import { AnalyticsMetadata } from './metrics/interfaces';

export const COMPONENT_METADATA_KEY = '__awsuiMetadata__';

interface AwsUiMetadata {
  name: string;
  version: string;
  theme?: string;
  analytics?: AnalyticsMetadata;
}

interface HTMLMetadataElement extends HTMLElement {
  [COMPONENT_METADATA_KEY]: AwsUiMetadata;
}

export interface PackageMetadata {
  packageVersion: string;
  packageTheme?: string;
}

export function useComponentMetadata<T = any>(
  componentName: string,
  packageVersionOrMetadata: string | PackageMetadata, // after updating all packages using useComponentMetadata, we support only PackageMetadata format
  analyticsMetadata?: AnalyticsMetadata
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (elementRef.current) {
      const node = elementRef.current as unknown as HTMLMetadataElement;

      // Handle both string and PackageMetadata formats
      const packageVersion =
        typeof packageVersionOrMetadata === 'string'
          ? packageVersionOrMetadata
          : packageVersionOrMetadata.packageVersion;

      const packageTheme =
        typeof packageVersionOrMetadata === 'string' ? undefined : packageVersionOrMetadata.packageTheme;

      const metadata: AwsUiMetadata = {
        name: componentName,
        version: packageVersion,
      };

      // Add theme to metadata if provided
      if (packageTheme !== undefined) {
        metadata.theme = packageTheme;
      }

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
