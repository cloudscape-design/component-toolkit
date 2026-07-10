// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { isDevelopment } from '../is-development.js';
import { warnOnce } from '../logging.js';

export interface PortalProps {
  container?: null | Element;
  getContainer?: (options: { abortSignal: AbortSignal }) => Promise<HTMLElement>;
  removeContainer?: (container: HTMLElement | null) => void;
  children: React.ReactNode;
}

function manageDefaultContainer(
  ownerDocument: Document,
  setState: React.Dispatch<React.SetStateAction<Element | null>>
) {
  const newContainer = ownerDocument.createElement('div');
  ownerDocument.body.appendChild(newContainer);
  setState(newContainer);
  return () => {
    ownerDocument.body.removeChild(newContainer);
  };
}

function manageAsyncContainer(
  getContainer: (options: { abortSignal: AbortSignal }) => Promise<HTMLElement>,
  removeContainer: (container: HTMLElement | null) => void,
  setState: React.Dispatch<React.SetStateAction<Element | null>>
) {
  let newContainer: HTMLElement | null = null;
  const abortController = new AbortController();
  getContainer({ abortSignal: abortController.signal }).then(
    container => {
      if (abortController.signal.aborted) {
        return;
      }
      newContainer = container;
      setState(container);
    },
    error => {
      console.warn('[AwsUi] [portal]: failed to load portal root', error);
    }
  );
  return () => {
    abortController.abort();
    removeContainer(newContainer);
  };
}

/**
 * A safe react portal component that renders to a provided node.
 * If a node isn't provided, it creates one under the owner document's body,
 * ensuring correct behavior inside iframes.
 */
export default function Portal({
  container,
  getContainer,
  removeContainer,
  children,
}: PortalProps): React.ReactPortal | React.ReactElement | null {
  const [activeContainer, setActiveContainer] = useState<Element | null>(container ?? null);
  const ref = React.useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (container) {
      setActiveContainer(container);
      return;
    }
    if (isDevelopment) {
      if (getContainer && !removeContainer) {
        warnOnce('portal', '`removeContainer` is required when `getContainer` is provided');
      }
      if (!getContainer && removeContainer) {
        warnOnce('portal', '`getContainer` is required when `removeContainer` is provided');
      }
    }
    if (getContainer && removeContainer) {
      return manageAsyncContainer(getContainer, removeContainer, setActiveContainer);
    }

    const ownerDocument = ref.current?.ownerDocument ?? document;
    return manageDefaultContainer(ownerDocument, setActiveContainer);
  }, [container, getContainer, removeContainer]);

  // On the first render, activeContainer is null because the layout effect hasn't
  // created it yet. We render a hidden probe span so the effect can read
  // ref.current.ownerDocument to discover the correct document (e.g. inside iframes).
  // In SSR there's no document, so we return null to match the previous behavior.
  if (!activeContainer && typeof document !== 'undefined') {
    return <span ref={ref} style={{ display: 'none' }} />;
  }

  return activeContainer && createPortal(children, activeContainer);
}
