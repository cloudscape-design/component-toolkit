#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// only run this within the scope of this package
if (process.env.npm_package_name && process.env.npm_package_name !== '@cloudscape-design/component-toolkit') {
  return;
}

/**
 * Remove specific @cloudscape-design/* packages where we should always use the latest minor release.
 * Also checks for any dependencies that incorrectly use CodeArtifact instead of npm.
 */
const fs = require('fs');
const filename = require.resolve('../package-lock.json');
const packageLock = require(filename);

Object.keys(packageLock.dependencies).forEach(dependencyName => {
  const dependency = packageLock.dependencies[dependencyName];
  if (dependencyName.startsWith('@cloudscape-design/')) {
    delete packageLock.dependencies[dependencyName];
  } else if (dependency.resolved && dependency.resolved.indexOf('codeartifact.us-west-2.amazonaws.com') !== -1) {
    throw Error('package-lock.json file contains a reference to CodeArtifact. Use regular npm to update the packages.');
  }
});
fs.writeFileSync(filename, JSON.stringify(packageLock, null, 2) + '\n');
console.log('Removed @cloudscape-design/ dependencies from package-lock file');
