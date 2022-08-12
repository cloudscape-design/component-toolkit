// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

const pages = import.meta.glob('./pages/*.tsx');

export default Object.entries(pages).map(([name, importPromise]) => ({
  name: name.replace('pages/', '').slice(2, -4),
  Component: React.lazy(importPromise as any),
}));
