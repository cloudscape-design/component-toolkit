// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

/**
 * Simplified version of ResizeObserverEntry
 */
export interface ContainerQueryEntry {
  /** Target element */
  target: Element;
  /** Element's content box width */
  contentBoxWidth: number;
  /** Element's content box height */
  contentBoxHeight: number;
  /** Element's border box width */
  borderBoxWidth: number;
  /** Element's border box height */
  borderBoxHeight: number;
}

/**
 * React reference or element callback
 */
export type ElementReference = (() => Element | null) | React.RefObject<Element>;
