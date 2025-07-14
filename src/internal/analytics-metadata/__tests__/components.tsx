// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { ReactNode, useEffect, useRef } from 'react';
import { METADATA_ATTRIBUTE, getAnalyticsMetadataAttribute, getAnalyticsLabelAttribute } from '../attributes';
import ReactDOM from 'react-dom';

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

export const ComponentTwo = () => (
  <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentTwo', label: '.component-label' } })}>
    <div className="component-label" {...getAnalyticsLabelAttribute('.sub-label')}>
      <div className="sub-label">sub label</div>
      <div>another text content to ignore</div>
    </div>
    <div id="id:nested:portal" />
  </div>
);

export const ComponentThree = ({ children }: { children?: ReactNode }) => (
  <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentThree' } })}>
    <div
      {...getAnalyticsMetadataAttribute({
        component: {
          innerContext: {
            position: '2',
            columnLabel: { selector: '.invalid-selector', root: 'self' },
            anotherLabel: { root: 'self' },
            yetAnotherLabel: { rootSelector: '.root-class-name' },
          },
        },
      })}
    >
      <ComponentTwo />
      <div data-awsui-referrer-id="id:nested:portal">
        <ComponentOne />
      </div>
      {children}
    </div>
  </div>
);

const NestedIframe = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) {
      return;
    }
    const iframeEl = container.ownerDocument.createElement('iframe');
    iframeEl.id = 'iframe-2';
    container.appendChild(iframeEl);

    const iframeDocument = iframeEl.contentDocument!;
    iframeDocument.open();
    iframeDocument.writeln('<!DOCTYPE html>');
    iframeDocument.close();
    iframeDocument.body.innerHTML =
      '<div><div data-awsui-analytics="{&quot;component&quot;:{&quot;name&quot;:&quot;ComponentThree&quot;}}"><div id="sub-sub-target">inside iframe inside iframe</div><div id="id:portal-2"></div></div><div data-awsui-referrer-id="id:portal-2"><div data-awsui-analytics="{&quot;component&quot;:{&quot;name&quot;:&quot;ComponentThreeInPortal&quot;}}"> </div></div></div>';

    return () => {
      container.removeChild(iframeEl);
    };
  });

  return (
    <>
      <h1>Nested title</h1>
      <div
        {...getAnalyticsMetadataAttribute({
          component: { name: 'ComponentTwo', label: { selector: 'h1', root: 'body' } },
        })}
      >
        <div>inside iframe</div>
        <div id="sub-target">
          <div ref={ref}></div>;<div id="id:portal-1"></div>
        </div>
      </div>
      <div data-awsui-referrer-id="id:portal-1">
        <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentTwoInPortal' } })}> </div>
      </div>
    </>
  );
};

export const AppWithIframe = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) {
      return;
    }
    const iframeEl = container.ownerDocument.createElement('iframe');
    iframeEl.id = 'iframe-1';
    container.appendChild(iframeEl);

    const iframeDocument = iframeEl.contentDocument!;
    iframeDocument.open();
    iframeDocument.writeln('<!DOCTYPE html>');
    iframeDocument.close();

    const innerAppRoot = iframeDocument.createElement('div');
    iframeDocument.body.appendChild(innerAppRoot);
    ReactDOM.render(<NestedIframe />, innerAppRoot);
    return () => {
      ReactDOM.unmountComponentAtNode(innerAppRoot);
      container.removeChild(iframeEl);
    };
  });

  return (
    <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentOne' } })}>
      <h1>Main title</h1>
      <div ref={ref}></div>;
      <iframe src="https://www.amazon.com/" />
    </div>
  );
};
