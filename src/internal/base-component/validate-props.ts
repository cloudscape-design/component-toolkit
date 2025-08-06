// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { isDevelopment } from '../is-development';

export function validateProps(
  componentName: string,
  props: Record<string, any>,
  excludedProps: Array<string>,
  allowedEnums: Record<string, Array<string>>,
  systemName = 'default'
) {
  if (!isDevelopment) {
    return;
  }
  for (const [prop, value] of Object.entries(props)) {
    if (excludedProps.includes(prop)) {
      throw new Error(`${componentName} does not support "${prop}" property when used in ${systemName} system`);
    }
    if (value && allowedEnums[prop] && !allowedEnums[prop].includes(value)) {
      throw new Error(
        `${componentName} does not support "${prop}" with value "${value}" when used in ${systemName} system`
      );
    }
  }
}
