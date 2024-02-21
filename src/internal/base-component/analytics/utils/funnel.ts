// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getContainerHeaderText, getLastBreadcrumbText, getModalHeaderText } from './page';

export function getModalFunnelName() {
  return getModalHeaderText();
}

export function getSinglePageFunnelName() {
  return getLastBreadcrumbText();
}

export function getMultiPageFunnelName() {
  return getLastBreadcrumbText();
}

export function getSubStepName(target: HTMLElement) {
  return getContainerHeaderText(target);
}

export function generateUUID() {
  // Generate random bytes
  const cryptoObj = window.crypto; // for IE 11
  const randomBytes = new Uint8Array(16);
  cryptoObj.getRandomValues(randomBytes);

  // Set the version (4) and variant (8, 9, A, or B) bits
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant 8, 9, A, or B

  // Format the bytes as a UUID string
  const uuid = Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  // Insert the dashes at the appropriate positions
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
}
