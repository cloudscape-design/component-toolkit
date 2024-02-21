// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { type Fiber } from 'react-reconciler';

const reactFiberPrefix = '__reactFiber$';
const react16FiberPrefix = '__reactInternalInstance$';

export function getFiberNodeFromElement(element: Element): Fiber | undefined {
  for (const key in element) {
    if (key.startsWith(reactFiberPrefix) || key.startsWith(react16FiberPrefix)) {
      return element[key as keyof Element] as unknown as Fiber;
    }
  }
}

export function getElementFromFiberNode(node: Fiber): HTMLElement | undefined {
  const fiberNodeRef = node.ref as any;
  return fiberNodeRef.current as HTMLElement;
}

export function getNodeFromRef(element: Element): HTMLElement | undefined {
  for (const key in element) {
    if (key.startsWith(reactFiberPrefix) || key.startsWith(react16FiberPrefix)) {
      const fiberNode = element[key as keyof Element] as unknown as Fiber;
      if (fiberNode.ref && (fiberNode.ref as any).current) {
        console.log('debug2', fiberNode);
        return getElementFromFiberNode(fiberNode);
      }
    }
  }
  return undefined;
}

export function findClosestAncestor(element: Element, componentName: string): Fiber | undefined {
  const startNode = getFiberNodeFromElement(element)!;
  for (let current: Fiber | null = startNode; current !== null && current !== undefined; current = current.return) {
    if (current.type?.displayName && current.type?.displayName === componentName) {
      return current;
    }
  }

  return undefined;
}

export function getComponentTree(startNode: Fiber): string[] {
  const ancestors = [];
  for (let current: Fiber | null = startNode; current !== null && current !== undefined; current = current.return) {
    if (current.type?.displayName) {
      ancestors.push(current.type.displayName);
    }
  }
  return ancestors;
}

export function findUp(componentName: string, node: HTMLElement, domSnapshot: Document = document): HTMLElement | null {
  if (!node.parentNode) {
    return null;
  }

  if ((node as any).__awsuiMetadata__?.name === componentName) {
    return node;
  }

  if (node.dataset.awsuiReferrerId) {
    const referrer = domSnapshot.getElementById(node.dataset.awsuiReferrerId) as HTMLElement;
    if (referrer) {
      return findUp(componentName, referrer);
    }
  }

  return findUp(componentName, node.parentNode as HTMLElement);
}

export function findDown(componentName: string, node: HTMLElement): HTMLElement | null {
  if ((node as any).__awsuiMetadata__?.name === componentName) {
    return node;
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const result = findDown(componentName, child as HTMLElement);
    if (result) {
      return result;
    }
  }

  return null;
}

export function isInComponent(element: HTMLElement, componentName: string) {
  const [, ...tree] = getComponentTree(getFiberNodeFromElement(element)!);
  return tree.includes(componentName);
}

export function getParentFunnelNode(element: HTMLElement = document.body): HTMLElement | null {
  if (isInComponent(element, 'Modal')) {
    return findDown('Form', element);
  }

  // Return the outer most Funnel
  let componentKey = undefined;
  const tree = getComponentTree(getFiberNodeFromElement(element)!);
  while (tree.length > 0) {
    const current = tree.pop();
    if (!current) {
      break;
    }

    if (['Wizard', 'Form', 'Modal'].includes(current)) {
      componentKey = current;
      break;
    }
  }

  if (!componentKey) {
    return null;
  }

  return findUp(componentKey, element);
}
