// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum KeyCode {
  pageUp = 33,
  pageDown = 34,
  end = 35,
  home = 36,
  backspace = 8,
  space = 32,
  down = 40,
  left = 37,
  right = 39,
  up = 38,
  escape = 27,
  enter = 13,
  tab = 9,
  shift = 16,
  control = 17,
  alt = 18,
  meta = 91,
}

export function isModifierKey(event: KeyboardEvent) {
  // we do not want to highlight focused element
  // when special keys are pressed
  return [KeyCode.shift, KeyCode.alt, KeyCode.control, KeyCode.meta].indexOf(event.keyCode) > -1;
}
