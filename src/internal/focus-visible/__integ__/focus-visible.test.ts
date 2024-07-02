// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import useBrowser from '@cloudscape-design/browser-test-tools/use-browser';
import { BasePageObject } from '@cloudscape-design/browser-test-tools/page-objects';

describe('focus-visible', () => {
  const setupTest = (testFn: (page: BasePageObject) => Promise<void>) => {
    return useBrowser(async browser => {
      const page = new BasePageObject(browser);
      await browser.url('/focus-visible.page');
      await testFn(page);
    });
  };

  const buttonOne = 'button:nth-of-type(1)';
  const buttonTwo = 'button:nth-of-type(2)';

  test(
    'applies focus style when focused with keyboard',
    setupTest(async page => {
      await page.click(buttonOne);
      await page.keys('Tab');
      await expect(page.getElementsText(buttonTwo)).resolves.toEqual(['Focusable button: focused!']);
    })
  );

  test(
    'does not apply focus style when focused with mouse',
    setupTest(async page => {
      await page.click(buttonTwo);
      await expect(page.getElementsText(buttonTwo)).resolves.toEqual(['Focusable button']);
    })
  );
});
