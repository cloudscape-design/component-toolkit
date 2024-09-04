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
      await expect(page.getElementsText('#target')).resolves.toEqual(['Content: 280/280\nBorder: 300/300']);
      await page.click('[id="width+"]');
      await page.click('[id="height-"]');
      await page.pause(10);
      await expect(page.getElementsText('#target')).resolves.toEqual(['Content: 290/270\nBorder: 310/290']);
    })
  );
});
