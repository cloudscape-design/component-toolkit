// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from 'react';

export const COMPONENT_METADATA_KEY = '__awsuiMetadata__';

interface AwsUiMetadata {
  name: string;
  version: string;
}

interface HTMLMetadataElement extends HTMLElement {
  [COMPONENT_METADATA_KEY]: AwsUiMetadata;
}

export function useComponentMetadata<T = any>(componentName: string, packageVersion: string) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (elementRef.current) {
      const node = elementRef.current as unknown as HTMLMetadataElement;
      const metadata: AwsUiMetadata = { name: componentName, version: packageVersion };

      Object.freeze(metadata);
      Object.defineProperty(node, COMPONENT_METADATA_KEY, { value: metadata, writable: false, configurable: true });
    }
  });

  return elementRef;
}
