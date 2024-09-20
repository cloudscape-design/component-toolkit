// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { isNode, isHTMLElement, isSVGElement } from '../element-types';

test('an HTMLElement is recognized as a Node and HTMLElement', () => {
  const div = document.createElement('div');
  expect(isNode(div)).toBe(true);
  expect(isHTMLElement(div)).toBe(true);
  expect(isSVGElement(div)).toBe(false);
});

test('an SVGElement is recognized as a Node and SVGElement', () => {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  expect(isNode(rect)).toBe(true);
  expect(isHTMLElement(rect)).toBe(false);
  expect(isSVGElement(rect)).toBe(true);
});

test('an object is recognized as Node', () => {
  expect(isNode({ nodeType: 3, nodeName: '', parentNode: {} })).toBe(true);
});

test('an object is recognized as HTMLElement', () => {
  const node = { nodeType: 1, nodeName: '', parentNode: {} };
  expect(isHTMLElement({ ...node, style: {}, ownerDocument: {} })).toBe(true);
  expect(isHTMLElement({ ...node, style: {}, ownerDocument: {}, ownerSVGElement: {} })).toBe(false);
});

test('an object is recognized as SVGElement', () => {
  const node = { nodeType: 1, nodeName: '', parentNode: {} };
  expect(isSVGElement({ ...node, style: {}, ownerDocument: {} })).toBe(false);
  expect(isSVGElement({ ...node, style: {}, ownerDocument: {}, ownerSVGElement: {} })).toBe(true);
});
