// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import { isDevelopment } from '../is-development';
import { warnOnce } from '../logging';

export interface PropertyDescriptions {
  componentName: string;
  changeHandlerName: string;
  propertyName: string;
}

export function useControllableStateMode<ValueType, HandlerType extends (...args: any[]) => unknown>(
  controlledValue: ValueType | undefined,
  changeHandler: HandlerType | undefined,
  propertyDescriptions: PropertyDescriptions
): { isControlled: boolean } {
  const { componentName, changeHandlerName, propertyName } = propertyDescriptions;

  // The decision whether a component is controlled or uncontrolled is made on
  // its first render and cannot be changed afterwards.
  const [isControlled] = useState(controlledValue !== undefined);

  // Most build tools will just strip this block from production builds, so we can
  // skip the conditional hook lint error.
  if (isDevelopment) {
    // Print a warning if a controlled property was passed in without a change handler.
    // This may fire every render if the change handler isn't memoized, but warnOnce
    // will dedupe the error messages.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (isControlled && changeHandler === undefined) {
        warnOnce(
          componentName,
          `You provided a \`${propertyName}\` prop without an \`${changeHandlerName}\` handler. This will render a non-interactive component.`
        );
      }
    }, [changeHandler, isControlled, componentName, changeHandlerName, propertyName]);

    // Print a warning if the component switches between controlled and uncontrolled mode.
    const isControlledValueProvided = controlledValue !== undefined;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (isControlled !== isControlledValueProvided) {
        const initialMode = isControlled ? 'controlled' : 'uncontrolled';
        const modeNow = isControlledValueProvided ? 'controlled' : 'uncontrolled';
        warnOnce(
          componentName,
          `A component tried to change ${initialMode} '${propertyName}' property to be ${modeNow}. ` +
            `This is not supported. Properties should not switch from ${initialMode} to ${modeNow} (or vice versa). ` +
            `Decide between using a controlled or uncontrolled mode for the lifetime of the component. ` +
            `More info: https://fb.me/react-controlled-components`
        );
      }
    }, [isControlled, isControlledValueProvided, propertyName, componentName]);
  }

  return { isControlled };
}
