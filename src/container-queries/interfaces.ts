// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
export { ContainerQueryEntry } from '../internal/container-queries/interfaces';

/**
 * React reference or element callback
 */
export type ElementReference = (() => Element | null) | React.RefObject<Element>;
