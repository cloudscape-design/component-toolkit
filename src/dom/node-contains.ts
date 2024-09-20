// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { isNode } from './element-types';

/**
 * Checks whether the given node is a parent of the other descendant node.
 * @param parent Parent node
 * @param descendant Node that is checked to be a descendant of the parent node
 */
export default function nodeContains(parent: Node | null, descendant: Node | EventTarget | null) {
  if (!parent || !descendant || !isNode(descendant)) {
    return false;
  }
  return parent.contains(descendant);
}
