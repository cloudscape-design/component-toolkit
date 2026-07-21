// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import styles from './style-api.module.scss';

export default function StyleApiPage() {
  return (
    <div style={{ margin: 16 }}>
      <h1>Style API v2 tools</h1>

      <h2>Without carrier tokens (public layer)</h2>
      <p>Single element; reads --awsui-style-* directly on the themed element.</p>
      <p>
        <CustomPill>Default</CustomPill> <CustomPill className={styles['theme-pill']}>Themed</CustomPill>
      </p>

      <h2>With carrier tokens (carrier layer)</h2>
      <p>The root re-anchors carriers; the title and body (descendants) read them.</p>
      <CustomPanel title="Default">Default style (no overrides).</CustomPanel>
      <br />
      <CustomPanel className={styles['theme-panel']} title="Themed">
        <div>
          <div>Themed via --awsui-style-* on the root; the title and body colors resolve through carriers.</div>
          <br />
          <CustomPanel title="Default">Default style (no overrides).</CustomPanel>
        </div>
      </CustomPanel>
    </div>
  );
}

function CustomPill(props: { className?: string; children?: React.ReactNode }) {
  return <span className={cx(styles.pill, props.className)}>{props.children}</span>;
}

function CustomPanel(props: { title: React.ReactNode; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cx(styles.panel, props.className)}>
      <div className={styles.title}>{props.title}</div>
      <div className={styles.body}>{props.children}</div>
    </div>
  );
}

function cx(...names: Array<string | undefined>) {
  return names.filter(Boolean).join(' ');
}
