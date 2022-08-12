// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import useResizeObserver from '../../../src/container-queries/use-resize-observer';
import { ContainerQueryEntry } from '../../../src';
import React, { useState } from 'react';

export default function Page() {
  const [entry, setEntry] = useState<null | ContainerQueryEntry>(null);

  useResizeObserver(() => document.querySelector('#target'), setEntry);

  const contentWidth = entry?.contentBoxWidth || 0;
  const contentHeight = entry?.contentBoxHeight || 0;
  const borderWidth = entry?.borderBoxWidth || 0;
  const borderHeight = entry?.borderBoxHeight || 0;

  return (
    <div
      id="target"
      style={{
        width: '100%',
        height: '100%',
        padding: '10px',
      }}
    >
      Content: {contentWidth}/{contentHeight}
      <br />
      Border: {borderWidth}/{borderHeight}
    </div>
  );
}
