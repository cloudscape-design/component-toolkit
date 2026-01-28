// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect } from 'react';
import { isModifierKey } from '../keycode.js';

const frames = new Map<Document, { componentsCount: number; abortController: AbortController }>();

function setIsKeyboard(active: boolean) {
  if (active) {
    for (const currentDocument of frames.keys()) {
      currentDocument.body.setAttribute('data-awsui-focus-visible', 'true');
    }
  } else {
    for (const currentDocument of frames.keys()) {
      currentDocument.body.removeAttribute('data-awsui-focus-visible');
    }
  }
}

function handleMousedown() {
  setIsKeyboard(false);
}

function handleKeydown(event: KeyboardEvent) {
  if (!isModifierKey(event)) {
    setIsKeyboard(true);
  }
}

function addListeners(currentDocument: Document): AbortController {
  const abortController = new AbortController();
  currentDocument.addEventListener('mousedown', handleMousedown, { signal: abortController.signal });
  currentDocument.addEventListener('keydown', handleKeydown, { signal: abortController.signal });
  return abortController;
}

export function useFocusVisible(componentRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const currentDocument = componentRef?.current?.ownerDocument ?? document;

    let frame = frames.get(currentDocument);
    if (frame) {
      frame.componentsCount++;
    } else {
      const abortController = addListeners(currentDocument);
      frame = { componentsCount: 1, abortController };
      frames.set(currentDocument, frame);
    }

    return () => {
      frame.componentsCount--;
      if (frame.componentsCount === 0) {
        frame.abortController.abort();
        frames.delete(currentDocument);
      }
    };
  }, [componentRef]);
}
