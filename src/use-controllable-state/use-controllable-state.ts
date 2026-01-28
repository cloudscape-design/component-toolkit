// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState, useEffect, useCallback } from 'react';
import { useStableCallback } from '../internal/stable-callback/index.js';
import { isDevelopment } from '../internal/is-development.js';
import { warnOnce } from '../internal/logging.js';
import { PropertyDescriptions } from './interfaces.js';

/**
 * This hook allows you to make a component that can be used both in controlled
 * mode and uncontrolled mode. Pass in your component's props, and then implement
 * your component as if it was only controlled.
 *
 * A component determines its mode (either controlled or uncontrolled) on the
 * first render and keeps it for its lifetime. The mode cannot be switched later.
 *
 * @example
 * Using useControllableState in a custom checkbox component
 * ```
 * const [checked, setChecked] = useControllable(
 *   props.checked,
 *   props.onChange,
 *   props.defaultEnabled ?? false,
 *   {
 *     componentName: 'MyCheckboxComponent',
 *     propertyName: 'checked',
 *     changeHandler: 'onChange'
 *   }
 * );
 *
 * return (
 *   <input
 *     type="checkbox"
 *     checked={checked}
 *     onChange={event => setChecked(event.target.checked)}
 *   />
 * );
 * ```
 *
 * @param controlledValue The value to use for controlled mode
 * @param changeHandler The update handler for controlled mode
 * @param defaultValue The initial value for uncontrolled mode
 * @param propertyDescriptions Property names used when emitting warnings
 * @param fireEvent Callback executed when controllable value changes
 * @returns A tuple of value and value setter
 */
export default function useControllable<ValueType, HandlerType extends (...args: any[]) => unknown>(
  controlledValue: ValueType | undefined,
  changeHandler: HandlerType | undefined,
  defaultValue: ValueType,
  propertyDescriptions: PropertyDescriptions,
  fireEvent = (value: ValueType, handler: HandlerType) => handler(value)
): [ValueType | undefined, (value: ValueType) => void] {
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

  // This is the value that is used if the component is uncontrolled.
  const [valueState, setValue] = useState<ValueType>(defaultValue);
  const [isUncontrolledValueSet, setIsUncontrolledValueSet] = useState(false);

  const stableFireEvent = useStableCallback((value: ValueType, handler: HandlerType) => fireEvent(value, handler));
  const setControlledValue = useCallback(
    (value: ValueType) => {
      if (changeHandler) {
        stableFireEvent(value, changeHandler);
      }
    },
    [changeHandler, stableFireEvent]
  );

  // We allow changes to the defaultValue prop to be reflected until the component
  // starts controlling it internally.
  const currentUncontrolledValue = isUncontrolledValueSet ? valueState : defaultValue;
  const setUncontrolledValue = useCallback((newValue: React.SetStateAction<ValueType>) => {
    setValue(newValue);
    setIsUncontrolledValueSet(true);
  }, []);

  return isControlled ? [controlledValue, setControlledValue] : [currentUncontrolledValue, setUncontrolledValue];
}
