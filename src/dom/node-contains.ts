// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Checks whether the given node is a parent of the other descendant node.
 * @param parent Parent node
 * @param descendant Node that is checked to be a descendant of the parent node
 */
export default function nodeContains(parent: Node | null, descendant: Node | EventTarget | null) {
  // ('nodeType' in descendant) is a workaround to check if descendant is a node
  //  Node interface is tied to the window it's created in, if the descendant was moved to an iframe after it was created,
  //  descendant instanceof Node will be false since Node has a different window
  if (!parent || !descendant || !('nodeType' in descendant)) {
    return false;
  }

  return parent.contains(descendant);
}
