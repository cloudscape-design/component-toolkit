// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { METADATA_ATTRIBUTE, getAnalyticsMetadataAttribute, getAnalyticsLabelAttribute } from '../attributes';

export const ComponentOne = ({ malformed }: { malformed?: boolean }) => (
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
          detail: {
            label: { selector: ['.event-label', '.second-event-label'], root: 'component' },
            keyTwo: 'valueTwo',
          },
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
    <div className="component-label" {...getAnalyticsLabelAttribute('.sub-label')}>
      <div className="sub-label">sub label</div>
      <div>another text content to ignore</div>
    </div>
    <div id="id:nested:portal" />
  </div>
);

export const ComponentThree = () => (
  <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentThree' } })}>
    <div
      {...getAnalyticsMetadataAttribute({
        component: {
          innerContext: {
            position: '2',
            columnLabel: { selector: '.invalid-selector', root: 'self' },
            anotherLabel: { root: 'self' },
            yetAnotherLabel: { rootClassName: 'root-class-name' },
          },
        },
      })}
    >
      <ComponentTwo />
      <div data-awsui-referrer-id="id:nested:portal">
        <ComponentOne />
      </div>
    </div>
  </div>
);
