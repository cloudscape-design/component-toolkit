#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

if (process.env.GITHUB_WORKFLOW) {
  process.exit(0);
} else {
  process.exit(1);
}
