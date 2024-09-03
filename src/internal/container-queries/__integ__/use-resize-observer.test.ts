// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import useBrowser from '@cloudscape-design/browser-test-tools/use-browser';
import { BasePageObject } from '@cloudscape-design/browser-test-tools/page-objects';

export class PageObject extends BasePageObject {
  resizeWindow(width: number, height: number) {
    return this.setWindowSize({ width, height });
  }
}

describe('use-resize-observer', () => {
  const setupTest = (testFn: (page: PageObject) => Promise<void>) => {
    return useBrowser(async browser => {
      const page = new PageObject(browser);
      await browser.url('/use-resize-observer-test');
      await testFn(page);
    });
  };

  test(
    'reports dimensions correctly',
    setupTest(async page => {
      await page.waitForVisible('#target');
      await page.resizeWindow(999, 777);
      await expect(page.getElementsText('#target')).resolves.toEqual(['Content: 979/757\nBorder: 999/777']);
      await page.resizeWindow(777, 333);
      await expect(page.getElementsText('#target')).resolves.toEqual(['Content: 757/313\nBorder: 777/333']);
    })
  );
});
