#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const libDir = join(rootDir, 'lib');
const libPkgPath = join(libDir, 'package.json');

const esmDir = join(libDir, 'mjs');
const esmPkgPath = join(esmDir, 'package.json');

const packageCjs = JSON.parse(readFileSync(libPkgPath, 'utf8'));
packageCjs.type = 'commonjs';

writeFileSync(libPkgPath, JSON.stringify(packageCjs, null, 2) + '\n');
writeFileSync(esmPkgPath, JSON.stringify({ type: 'module' }, null, 2) + '\n');
