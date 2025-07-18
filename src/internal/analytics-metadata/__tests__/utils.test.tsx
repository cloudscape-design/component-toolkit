// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getGeneratedAnalyticsMetadata } from '../utils';
import { METADATA_ATTRIBUTE, activateAnalyticsMetadata } from '../attributes';
import { ComponentOne, ComponentThree } from './components';

describe('getGeneratedAnalyticsMetadata', () => {
  describe('with active analytics metadata', () => {
    beforeAll(() => {
      activateAnalyticsMetadata(true);
    });
    test('returns an empty object when input is null', () => {
      expect(getGeneratedAnalyticsMetadata(null)).toEqual({});
    });
    test('skips malformed metadata', () => {
      const { container } = render(
        <div {...{ [METADATA_ATTRIBUTE]: "{'corruptedJSON':}" }}>
          <ComponentOne malformed={true} />
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;
      expect(getGeneratedAnalyticsMetadata(target)).toEqual({
        action: 'select',
        detail: { label: 'event label', keyTwo: 'valueTwo' },
        contexts: [
          {
            type: 'component',
            detail: { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
          },
        ],
      });
    });
    test('resolves labels and merges metadata', () => {
      const { container } = render(<ComponentOne />);
      const target = container.querySelector('#target') as HTMLElement;
      expect(getGeneratedAnalyticsMetadata(target)).toEqual({
        action: 'select',
        detail: { label: 'event label', keyOne: 'valueOne', keyTwo: 'overriddenValueTwo' },
        contexts: [
          {
            type: 'component',
            detail: { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
          },
        ],
      });
    });
    test('resolves contexts chain and label attribute, and redirects portals', () => {
      const { container } = render(<ComponentThree />);
      const target = container.querySelector('#target') as HTMLElement;
      expect(getGeneratedAnalyticsMetadata(target)).toEqual({
        action: 'select',
        detail: { label: 'event label', keyOne: 'valueOne', keyTwo: 'overriddenValueTwo' },
        contexts: [
          {
            type: 'component',
            detail: { name: 'ComponentOne', label: 'component label', properties: { multi: 'true' } },
          },
          {
            type: 'component',
            detail: { name: 'ComponentTwo', label: 'sub label' },
          },
          {
            type: 'component',
            detail: {
              name: 'ComponentThree',
              properties: { arr: ['a', 'b'] },
              innerContext: {
                position: '2',
                columnLabel: '',
                anotherLabel: 'sub labelanother text content to ignorecontentcomponent labelevent label',
                yetAnotherLabel: '',
              },
            },
          },
        ],
      });
    });
  });

  describe('with inactive analytics metadata', () => {
    beforeAll(() => {
      activateAnalyticsMetadata(false);
    });
    test('returns an empty object', () => {
      const { container } = render(<ComponentThree />);
      const target = container.querySelector('#target') as HTMLElement;
      expect(getGeneratedAnalyticsMetadata(target)).toEqual({});
    });
  });
});
