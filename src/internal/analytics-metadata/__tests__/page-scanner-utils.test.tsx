// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { getComponentsTree } from '../utils';
import { METADATA_ATTRIBUTE, activateAnalyticsMetadata, getAnalyticsMetadataAttribute } from '../attributes';
import { AppWithIframe, ComponentOne, ComponentTwo, ComponentThree } from './components';

describe('getComponentsTree', () => {
  describe('with active analytics metadata', () => {
    beforeAll(() => {
      activateAnalyticsMetadata(true);
    });
    test('returns an empty array when input is null', () => {
      expect(getComponentsTree(null)).toEqual([]);
    });
    test('skips metadata that does not refer to a component', () => {
      const { container } = render(
        <div id="outer-target">
          <ComponentOne />
        </div>
      );
      const target = container.querySelector('#outer-target') as HTMLElement;
      expect(getComponentsTree(target)).toEqual([
        { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
      ]);
    });
    test('only includes components inside the specified element', () => {
      const { container } = render(
        <>
          <div id="outer-target-1">
            <ComponentOne />
          </div>
          <div id="outer-target-2">
            <ComponentTwo />
          </div>
        </>
      );
      expect(getComponentsTree(container.querySelector('#outer-target-1') as HTMLElement)).toEqual([
        { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
      ]);
      expect(getComponentsTree(container.querySelector('#outer-target-2') as HTMLElement)).toEqual([
        { name: 'ComponentTwo', label: 'sub label' },
      ]);
    });
    test('can include multiple components', () => {
      const { container } = render(
        <div id="outer-target-1">
          <ComponentThree />
          <ComponentTwo />
        </div>
      );
      expect(getComponentsTree(container.querySelector('#outer-target-1') as HTMLElement)).toEqual([
        {
          name: 'ComponentThree',
          children: [
            {
              name: 'ComponentTwo',
              label: 'sub label',
              children: [{ name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } }],
            },
          ],
        },
        { name: 'ComponentTwo', label: 'sub label' },
      ]);
    });
    test('can include multiple nested components', () => {
      const { container } = render(
        <div id="outer-target-1">
          <ComponentThree>
            <ComponentTwo />
          </ComponentThree>
        </div>
      );
      expect(getComponentsTree(container.querySelector('#outer-target-1') as HTMLElement)).toEqual([
        {
          name: 'ComponentThree',
          children: [
            {
              name: 'ComponentTwo',
              label: 'sub label',
              children: [{ name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } }],
            },
            { name: 'ComponentTwo', label: 'sub label' },
          ],
        },
      ]);
    });
    test('use document as default element', () => {
      render(
        <>
          <ComponentThree />
          <ComponentTwo />
        </>
      );
      expect(getComponentsTree()).toEqual([
        {
          name: 'ComponentThree',
          children: [
            {
              name: 'ComponentTwo',
              label: 'sub label',
              children: [{ name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } }],
            },
          ],
        },
        { name: 'ComponentTwo', label: 'sub label' },
      ]);
    });
    test('skips malformed metadata', () => {
      const { container } = render(
        <div id="outer-target" {...{ [METADATA_ATTRIBUTE]: "{'corruptedJSON':}" }}>
          <ComponentOne malformed={true} />
        </div>
      );
      const target = container.querySelector('#outer-target') as HTMLElement;
      expect(getComponentsTree(target)).toEqual([
        { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
      ]);
    });
    describe('with portals', () => {
      test('returns an empty array when portal outside of the node element', () => {
        const { container } = render(
          <div id="outer-target">
            <div id="id:portal-1"></div>
            <div data-awsui-referrer-id="id:portal-1">
              <ComponentOne />
            </div>
            <div id="inner-target"></div>
          </div>
        );
        const target = container.querySelector('#inner-target') as HTMLElement;
        expect(getComponentsTree(target)).toEqual([]);
      });
      test('returns nested portal correctly', () => {
        const { container } = render(
          <div id="outer-target">
            <div data-awsui-referrer-id="id:portal-1">
              <ComponentOne />
            </div>
            <div id="inner-target">
              <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentFour' } })}>
                <ComponentTwo />
                <div id="id:portal-1"></div>
              </div>
            </div>
          </div>
        );
        expect(getComponentsTree(container.querySelector('#outer-target') as HTMLElement)).toEqual([
          {
            name: 'ComponentFour',
            children: [
              { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
              { name: 'ComponentTwo', label: 'sub label' },
            ],
          },
        ]);
        expect(getComponentsTree(container.querySelector('#inner-target') as HTMLElement)).toEqual([
          {
            name: 'ComponentFour',
            children: [
              { name: 'ComponentTwo', label: 'sub label' },
              { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
            ],
          },
        ]);
      });
      test('returns recursively nested portals', () => {
        const { container } = render(
          <div id="outer-target">
            <div data-awsui-referrer-id="id:portal-1">
              <ComponentOne />
              <div id="id:portal-2"></div>
            </div>
            <div data-awsui-referrer-id="id:portal-2">
              <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentFive' } })} />
            </div>
            <div id="inner-target">
              <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentFour' } })}>
                <ComponentTwo />
                <div id="id:portal-1"></div>
              </div>
            </div>
          </div>
        );
        expect(getComponentsTree(container.querySelector('#inner-target') as HTMLElement)).toEqual([
          {
            name: 'ComponentFour',
            children: [
              { name: 'ComponentTwo', label: 'sub label' },
              { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
              { name: 'ComponentFive' },
            ],
          },
        ]);
      });
    });
    test('with iframes', async () => {
      const { container } = render(<AppWithIframe />);
      await waitFor(() => {
        (
          (document.querySelector('#iframe-1') as HTMLIFrameElement)?.contentDocument?.querySelector(
            '#iframe-2'
          ) as HTMLIFrameElement
        )?.contentDocument?.querySelector('#sub-sub-target');
      });
      expect(getComponentsTree()).toEqual([
        {
          name: 'ComponentOne',
          children: [
            {
              name: 'ComponentTwo',
              label: 'Nested title',
              children: [
                { name: 'ComponentTwoInPortal' },
                { name: 'ComponentThree', children: [{ name: 'ComponentThreeInPortal' }] },
              ],
            },
          ],
        },
      ]);
      const subTarget = (container.querySelector('#iframe-1') as HTMLIFrameElement)!.contentDocument!.querySelector(
        '#sub-target'
      )!;
      expect(getComponentsTree(subTarget as HTMLElement)).toEqual([
        { name: 'ComponentTwoInPortal' },
        { name: 'ComponentThree', children: [{ name: 'ComponentThreeInPortal' }] },
      ]);
    });
  });

  describe('with inactive analytics metadata', () => {
    beforeAll(() => {
      activateAnalyticsMetadata(false);
    });
    test('returns an empty object', () => {
      const { container } = render(<ComponentThree />);
      const target = container.querySelector('#target') as HTMLElement;
      expect(getComponentsTree(target)).toEqual([]);
    });
  });
});
