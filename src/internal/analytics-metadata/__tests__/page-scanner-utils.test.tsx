// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getComponentsTree } from '../utils';
import { METADATA_ATTRIBUTE, activateAnalyticsMetadata } from '../attributes';
import { ComponentOne, ComponentTwo, ComponentThree } from './components';

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
        { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' }, children: [] },
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
        { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' }, children: [] },
      ]);
      expect(getComponentsTree(container.querySelector('#outer-target-2') as HTMLElement)).toEqual([
        { name: 'ComponentTwo', label: 'sub label', children: [] },
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
            { name: 'ComponentTwo', label: 'sub label', children: [] },
            { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' }, children: [] },
          ],
        },
        { name: 'ComponentTwo', label: 'sub label', children: [] },
      ]);
    });
    test('can include multiple nested components', () => {
      const { container } = render(
        <div id="outer-target-1">
          <ComponentThree>
            <ComponentThree />
          </ComponentThree>
        </div>
      );
      expect(getComponentsTree(container.querySelector('#outer-target-1') as HTMLElement)).toEqual([
        {
          name: 'ComponentThree',
          children: [
            { name: 'ComponentTwo', label: 'sub label', children: [] },
            { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' }, children: [] },
            {
              name: 'ComponentThree',
              children: [
                { name: 'ComponentTwo', label: 'sub label', children: [] },
                { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' }, children: [] },
              ],
            },
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
            { name: 'ComponentTwo', label: 'sub label', children: [] },
            { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' }, children: [] },
          ],
        },
        { name: 'ComponentTwo', label: 'sub label', children: [] },
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
        { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' }, children: [] },
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
