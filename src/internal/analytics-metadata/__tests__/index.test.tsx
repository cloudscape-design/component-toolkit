// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getGeneratedAnalyticsMetadata } from '../';
import { METADATA_ATTRIBUTE, getAnalyticsMetadataAttribute, getAnalyticslabelAttribute } from '../attributes';

const ComponentOne = ({ malformed }: { malformed?: boolean }) => (
  <div
    {...getAnalyticsMetadataAttribute({
      component: { name: 'ComponentOne', label: '.component-label', properties: { multi: 'true' } },
    })}
  >
    <div
      {...(malformed
        ? { [METADATA_ATTRIBUTE]: "{'corruptedJSON':}" }
        : getAnalyticsMetadataAttribute({ detail: { keyOne: 'valueOne', keyTwo: 'overriddenValueTwo' } }))}
    >
      <div
        id="target"
        {...getAnalyticsMetadataAttribute({
          action: 'select',
          detail: { label: { selector: '.event-label', root: 'component' }, keyTwo: 'valueTwo' },
        })}
      >
        content
      </div>
    </div>
    <div className="component-label">component label</div>
    <div className="event-label">event label</div>
  </div>
);

const ComponentTwo = () => (
  <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentTwo', label: '.component-label' } })}>
    <div className="component-label" {...getAnalyticslabelAttribute('.sub-label')}>
      <div className="sub-label">sub label</div>
      <div>another text content to ignore</div>
    </div>
    <div id="id:nested:portal" />
  </div>
);

const ComponentThree = () => (
  <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentThree' } })}>
    <div
      {...getAnalyticsMetadataAttribute({
        component: { innerContext: { position: '2', columnLabel: '.invalid-selector' } },
      })}
    >
      <ComponentTwo />
      <div data-awsui-referrer-id="id:nested:portal">
        <ComponentOne />
      </div>
    </div>
  </div>
);

describe('getGeneratedAnalyticsMetadata', () => {
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
          detail: { name: 'ComponentThree', innerContext: { position: '2', columnLabel: '' } },
        },
      ],
    });
  });
});
