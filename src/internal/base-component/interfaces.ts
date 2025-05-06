// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PackageSettings } from './metrics/interfaces';

export interface Environment extends PackageSettings {
  alwaysVisualRefresh: boolean;
}
