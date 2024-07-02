// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import useFocusVisible from '../../../src/internal/focus-visible';
import styles from './focus-visible.module.scss';

export default function FocusVisiblePage() {
  useFocusVisible();
  return (
    <>
      <button>Plain button</button>
      <button className={styles['focus-visible']}>
        Focusable button
        <span className={styles.inner}>: focused!</span>
      </button>
    </>
  );
}
