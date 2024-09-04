// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useResizeObserver } from '../../../src/internal/container-queries/use-resize-observer';
import { ContainerQueryEntry } from '../../../src';
import React, { useState } from 'react';

export default function Page() {
  const [entry, setEntry] = useState<null | ContainerQueryEntry>(null);

  useResizeObserver(() => document.querySelector('#target'), setEntry);

  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(300);

  return (
    <div style={{ margin: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button id="width+" onClick={() => setWidth(prev => prev + 10)}>
          Width + 10px
        </button>
        <button id="width-" onClick={() => setWidth(prev => prev - 10)}>
          Width - 10px
        </button>
        <button id="height+" onClick={() => setHeight(prev => prev + 10)}>
          Height + 10px
        </button>
        <button id="height-" onClick={() => setHeight(prev => prev - 10)}>
          Height - 10px
        </button>
      </div>

      <div id="container" style={{ width, height, background: 'gray' }}>
        <div
          id="target"
          style={{
            width: '100%',
            height: '100%',
            padding: '10px',
          }}
        >
          Content: {entry?.contentBoxWidth || 0}/{entry?.contentBoxHeight || 0}
          <br />
          Border: {entry?.borderBoxWidth || 0}/{entry?.borderBoxHeight || 0}
        </div>
      </div>
    </div>
  );
}
