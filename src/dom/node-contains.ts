// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Checks whether the given node is a parent of the other descendant node.
 * This utility is helpful when the parent might be an SVG element,
 * which doesn't have a native `contains` implementation on some browsers like IE11.
 * @param parent Parent node
 * @param descendant Node that is checked to be a descendant of the parent node
 */
export default function nodeContains(parent: Node | null, descendant: Node | null) {
  if (!parent || !descendant) {
    return false;
  }

  // Use the native `contains` method when available
  if (parent.contains && descendant.nodeType === Node.ELEMENT_NODE) {
    return parent === descendant || parent.contains(descendant);
  }

  // Fall back to a simple upwards tree traversal
  let upperNode: Node | null = descendant;
  while (upperNode && parent !== upperNode) {
    upperNode = upperNode.parentNode;
  }
  return upperNode === parent;
}
