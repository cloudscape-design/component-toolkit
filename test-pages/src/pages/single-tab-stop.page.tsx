// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as React from 'react';
import { useSingleTabStopNavigation } from '../../../src/internal/single-tab-stop';

import SingleTabStopKeyboardNav from '../../../src/internal/single-tab-stop/keyboard-nav-util';
import useForwardFocus from '../../../src/internal/utils/use-forward-focus';

import styles from './single-tab-stop.module.scss';

export default function SingleTabStop() {
  const itemsRef = React.useRef<Record<string, any | null>>({});

  return (
    <div>
      <button>Before</button>
      <SingleTabStopKeyboardNav matchId="button">
        Horizontal:
        <TestButton id="one" ref={element => (itemsRef.current.one = element)}>
          One
        </TestButton>
        <TestButton id="two" ref={element => (itemsRef.current.two = element)}>
          Two
        </TestButton>
        <TestButton id="three" ref={element => (itemsRef.current.three = element)}>
          Three
        </TestButton>
      </SingleTabStopKeyboardNav>
      <SingleTabStopKeyboardNav matchId="button" direction="vertical">
        Vertical:
        <div className={styles['vertical-container']}>
          <TestButton id="four" ref={element => (itemsRef.current.four = element)}>
            Four
          </TestButton>
          <TestButton id="five" ref={element => (itemsRef.current.five = element)}>
            Five
          </TestButton>
          <TestButton id="six" ref={element => (itemsRef.current.six = element)}>
            Six
          </TestButton>
        </div>
      </SingleTabStopKeyboardNav>
      <button>After</button>
    </div>
  );
}

const TestButton = React.forwardRef(
  ({ id, children }: { id: string; children: string }, ref: React.Ref<HTMLButtonElement | null>) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const { tabIndex } = useSingleTabStopNavigation(buttonRef);
    useForwardFocus(ref, buttonRef);

    return (
      <button tabIndex={tabIndex} id={id} data-itemid={id} ref={buttonRef}>
        {children}
      </button>
    );
  }
);
