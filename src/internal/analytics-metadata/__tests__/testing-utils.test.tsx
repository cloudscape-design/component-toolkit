// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getRawAnalyticsMetadata } from '../testing-utils';
import { METADATA_ATTRIBUTE, activateAnalyticsMetadata } from '../attributes';
import { ComponentOne, ComponentThree } from './components';

beforeAll(() => {
  activateAnalyticsMetadata(true);
});

describe('getRawAnalyticsMetadata', () => {
  test('returns metadata and labels', () => {
    const { container } = render(<ComponentThree />);
    const target = container.querySelector('#target') as HTMLElement;
    expect(getRawAnalyticsMetadata(target)).toEqual({
      metadata: [
        {
          action: 'select',
          detail: {
            label: {
              selector: ['.event-label', '.second-event-label'],
              root: 'component',
            },
            keyTwo: 'valueTwo',
          },
        },
        {
          detail: {
            keyOne: 'valueOne',
            keyTwo: 'overriddenValueTwo',
          },
        },
        {
          component: {
            name: 'ComponentOne',
            label: '.component-label',
            properties: {
              multi: 'true',
            },
          },
        },
        {
          component: {
            name: 'ComponentTwo',
            label: '.component-label',
          },
        },
        {
          component: {
            innerContext: {
              position: '2',
              columnLabel: {
                selector: '.invalid-selector',
                root: 'self',
              },
              anotherLabel: {
                root: 'self',
              },
              yetAnotherLabel: {
                rootClassName: 'root-class-name',
              },
            },
          },
        },
        {
          component: {
            name: 'ComponentThree',
          },
        },
      ],
      labelSelectors: [
        '.event-label',
        '.second-event-label',
        '.component-label',
        '.component-label',
        '.invalid-selector',
        '.root-class-name',
      ],
    });
  });
  test('skips malformed metadata', () => {
    const { container } = render(
      <div {...{ [METADATA_ATTRIBUTE]: "{'corruptedJSON':}" }}>
        <ComponentOne malformed={true} />
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;
    expect(getRawAnalyticsMetadata(target)).toEqual({
      metadata: [
        {
          action: 'select',
          detail: {
            label: { selector: ['.event-label', '.second-event-label'], root: 'component' },
            keyTwo: 'valueTwo',
          },
        },
        {
          component: { name: 'ComponentOne', label: '.component-label', properties: { multi: 'true' } },
        },
      ],
      labelSelectors: ['.event-label', '.second-event-label', '.component-label'],
    });
  });
});
