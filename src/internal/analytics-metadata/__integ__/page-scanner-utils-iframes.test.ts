// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import useBrowser from '@cloudscape-design/browser-test-tools/use-browser';
import { BasePageObject } from '@cloudscape-design/browser-test-tools/page-objects';
import { Browser } from 'webdriverio';
import { getComponentsTree } from '../page-scanner-utils';

// Extend the Window interface to include the getComponentsTree property
declare global {
  interface Window {
    getComponentsTree: typeof getComponentsTree;
  }
}

describe('getComponentsTree', () => {
  const setupTest = (testFn: (page: BasePageObject, browser: Browser) => Promise<void>) => {
    return useBrowser(async browser => {
      const page = new BasePageObject(browser);
      await browser.url('/with-iframe');
      await testFn(page, browser);
    });
  };

  test(
    'gets component metadata, including iframes',
    setupTest(async (page, browser) => {
      await page.runInsideIframe('#iframe-1', true, async () => {
        await page.runInsideIframe('#iframe-2', true, async () => {
          await page.waitForVisible('#sub-sub-target');
        });
      });
      const tree = await browser.execute(() => {
        return window.getComponentsTree();
      });
      expect(tree).toEqual([
        {
          name: 'ComponentOne',
          children: [
            {
              name: 'ComponentTwo',
              children: [
                { name: 'ComponentTwoInPortal' },
                { name: 'ComponentThree', children: [{ name: 'ComponentThreeInPortal' }] },
              ],
            },
          ],
        },
      ]);
    })
  );
  test(
    'gets component metadata of sub-tree inside an iframe',
    setupTest(async (page, browser) => {
      await page.runInsideIframe('#iframe-1', true, async () => {
        await page.runInsideIframe('#iframe-2', true, async () => {
          await page.waitForVisible('#sub-sub-target');
        });
      });
      const tree = await browser.execute(() => {
        const iframe = document.querySelector('#iframe-1') as HTMLIFrameElement;
        const iframeDocument = iframe!.contentDocument;
        const subTarget = iframeDocument!.querySelector('#sub-target') as HTMLElement;
        return window.getComponentsTree(subTarget);
      });
      expect(tree).toEqual([
        { name: 'ComponentTwoInPortal' },
        { name: 'ComponentThree', children: [{ name: 'ComponentThreeInPortal' }] },
      ]);
    })
  );
});
