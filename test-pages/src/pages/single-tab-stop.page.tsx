// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { SingleTabStopNavigationAPI, SingleTabStopNavigationProvider } from '../../../src/internal/single-tab-stop';

import handleKey from '../../../src/internal/utils/handle-key';
import { circleIndex } from '../../../src/internal/utils/circle-index';
import { KeyCode } from '../../../src/internal/keycode';
import { getAllFocusables } from '../../../src/internal/focus-lock/utils';

export default function SingleTabStop() {
  const navigationAPI = React.useRef<SingleTabStopNavigationAPI>(null);
  const containerObjectRef = React.useRef<HTMLDivElement>(null);
  const focusedIdRef = React.useRef<null | string>(null);

  function onUnregisterActive(focusableElement: HTMLElement) {
    // Only refocus when the node is actually removed (no such ID anymore).
    const target = navigationAPI.current?.getFocusTarget();

    if (target && target.dataset.itemid !== focusableElement.dataset.itemid) {
      target.focus();
    }
  }

  function getNextFocusTarget(): null | HTMLElement {
    if (containerObjectRef.current) {
      const buttons: HTMLButtonElement[] = Array.from(containerObjectRef.current.querySelectorAll('button'));
      return buttons.find(button => button.dataset.itemid === focusedIdRef.current) ?? buttons[0] ?? null;
    }
    return null;
  }

  React.useEffect(() => {
    navigationAPI.current?.updateFocusTarget();
  }, []);

  function onFocus(event: React.FocusEvent) {
    if (event.target instanceof HTMLElement && event.target.dataset.itemid) {
      focusedIdRef.current = event.target.dataset.itemid;
    }

    navigationAPI.current?.updateFocusTarget();
  }

  function onBlur() {
    navigationAPI.current?.updateFocusTarget();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const focusTarget = navigationAPI.current?.getFocusTarget();
    const specialKeys = [KeyCode.right, KeyCode.left, KeyCode.end, KeyCode.home, KeyCode.pageUp, KeyCode.pageDown];

    const hasModifierKeys = (event: React.MouseEvent | React.KeyboardEvent) => {
      return event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
    };

    if (hasModifierKeys(event) || specialKeys.indexOf(event.keyCode) === -1) {
      return;
    }
    if (!containerObjectRef.current || !focusTarget) {
      return;
    }
    // Ignore navigation when the focused element is not an item.
    if (document.activeElement && !document.activeElement.matches('button')) {
      return;
    }
    event.preventDefault();

    const focusables = getFocusablesFrom(containerObjectRef.current);

    const activeIndex = focusables.indexOf(focusTarget);
    handleKey(event as any, {
      onHome: () => focusElement(focusables[0]),
      onEnd: () => focusElement(focusables[focusables.length - 1]),
      onInlineStart: () => focusElement(focusables[circleIndex(activeIndex - 1, [0, focusables.length - 1])]),
      onInlineEnd: () => focusElement(focusables[circleIndex(activeIndex + 1, [0, focusables.length - 1])]),
    });
  }

  function focusElement(element: HTMLElement) {
    console.log(navigationAPI.current, 'navigationAPI');
    element.focus();
  }

  // List all non-disabled and registered focusables: those are eligible for keyboard navigation.
  function getFocusablesFrom(target: HTMLElement) {
    // function isElementRegistered(element: HTMLElement) {
    //   return navigationAPI.current?.isRegistered(element) ?? false;
    // }

    return getAllFocusables(target);
    //return getAllFocusables(target).filter(el => isElementRegistered(el));
  }

  return (
    <div ref={containerObjectRef} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown}>
      <SingleTabStopNavigationProvider
        ref={navigationAPI}
        navigationActive={true}
        getNextFocusTarget={getNextFocusTarget}
        onUnregisterActive={onUnregisterActive}
      >
        <button id="one" data-itemid="one">
          One
        </button>
        <button id="two" data-itemid="two">
          Two
        </button>
        <button id="three" data-itemid="three">
          Three
        </button>
      </SingleTabStopNavigationProvider>
    </div>
  );
}
