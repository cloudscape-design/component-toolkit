// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function getLastBreadcrumbText() {
  const breadcrumbs = document.querySelectorAll('[data-analytics-selector="breadcrumb-item"]');
  return breadcrumbs[breadcrumbs.length - 1].textContent;
}

/**
 * Calculate the name for a given Form
 * 1. Check for Form Header Component
 * 2. Check for Form Header Slot
 */
export function getFormHeaderText() {
  const formHeader = document.querySelector('[data-analytics-selector="form-header"]');
  const formHeaderSlot = formHeader?.querySelector('[data-analytics-selector="header-text"]');
  if (formHeaderSlot) {
    return formHeaderSlot.textContent;
  }

  return formHeader?.textContent;
}

export function getModalHeaderText() {
  return '';
}

export function getContainerHeaderText(target: HTMLElement) {
  const containerHeader = target.querySelector('[data-analytics-selector="container-header"]');
  const containerHeaderSlot = containerHeader?.querySelector('[data-analytics-selector="header-text"]');
  if (containerHeaderSlot) {
    return containerHeaderSlot.textContent;
  }

  return containerHeader?.textContent;
}
