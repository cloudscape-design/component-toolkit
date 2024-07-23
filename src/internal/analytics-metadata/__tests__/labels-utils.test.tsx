// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { getLabelFromElement, processLabel } from '../labels-utils';
import { getAnalyticsMetadataAttribute, getAnalyticsLabelAttribute, activateAnalyticsMetadata } from '../attributes';

beforeAll(() => {
  activateAnalyticsMetadata(true);
});

describe('getLabelFromElement', () => {
  test('returns an empty string if the element is null', () => {
    expect(getLabelFromElement(null)).toEqual('');
  });
  test('returns text content', () => {
    const { container } = render(
      <div>
        <div id="target1">content</div>
        <div id="target2">
          <span>text 1</span>
          <span>text 2</span>
        </div>
      </div>
    );
    const target1 = container.querySelector('#target1');
    expect(getLabelFromElement(target1 as HTMLElement)).toEqual('content');
    const target2 = container.querySelector('#target2');
    expect(getLabelFromElement(target2 as HTMLElement)).toEqual('text 1text 2');
  });
  test('returns aria-label if defined', () => {
    const { container } = render(
      <div>
        <div id="target" aria-label="returned label" aria-labelledby="id:r55:">
          content
        </div>
        <div id="id:r55:" aria-label="labelled by label">
          content
        </div>
      </div>
    );
    const target = container.querySelector('#target');
    expect(getLabelFromElement(target as HTMLElement)).toEqual('returned label');
  });
  test('returns aria label of aria-labelledby element', () => {
    const { container } = render(
      <div>
        <div id="target" aria-labelledby="id:r55:">
          content
        </div>
        <div id="id:r55:" aria-label="labelled by label">
          content
        </div>
      </div>
    );
    const target = container.querySelector('#target');
    expect(getLabelFromElement(target as HTMLElement)).toEqual('labelled by label');
  });
  test('returns text content of aria-labelledby element', () => {
    const { container } = render(
      <div>
        <div id="target" aria-labelledby="id:r55:">
          content
        </div>
        <div id="id:r55:">second content</div>
      </div>
    );
    const target = container.querySelector('#target');
    expect(getLabelFromElement(target as HTMLElement)).toEqual('second content');
  });
  test('returns text content of first aria-labelledby element', () => {
    const { container } = render(
      <div>
        <div id="target" aria-labelledby="id:r55: id:r56:">
          content
        </div>
        <div id="id:r55:">second content</div>
        <div id="id:r56:">third content</div>
      </div>
    );
    const target = container.querySelector('#target');
    expect(getLabelFromElement(target as HTMLElement)).toEqual('second content');
  });
  test('returns empty string if aria-labelledby element does not exist', () => {
    const { container } = render(
      <div>
        <div id="target" aria-labelledby="id:r55: id:r56:">
          content
        </div>
      </div>
    );
    const target = container.querySelector('#target');
    expect(getLabelFromElement(target as HTMLElement)).toEqual('');
  });
  test('trims the label', () => {
    const { container } = render(
      <div>
        <div id="target1" aria-label=" abcd efg ">
          content
        </div>
        <div id="target2">
          {'   '}content{'   '}
        </div>
      </div>
    );
    const target1 = container.querySelector('#target1');
    expect(getLabelFromElement(target1 as HTMLElement)).toEqual('abcd efg');
    const target2 = container.querySelector('#target2');
    expect(getLabelFromElement(target2 as HTMLElement)).toEqual('content');
  });
});

describe('processLabel', () => {
  test('returns an empty string when element and/or identifier are null', () => {
    const { container } = render(
      <div>
        <div id="target">content</div>
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;

    expect(processLabel(null, null)).toEqual('');
    expect(processLabel(target, null)).toEqual('');
    expect(processLabel(null, 'selector')).toEqual('');
  });
  test('returns an empty string when the selector cannot be resolved to an element', () => {
    const { container } = render(
      <div>
        <div id="target">content</div>
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;

    expect(processLabel(target, 'invalid-selector')).toEqual('');
  });
  test('returns node label when selector is an empty string', () => {
    const { container } = render(
      <div>
        <div id="target">content</div>
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;

    expect(processLabel(target, '')).toEqual('content');
    expect(processLabel(target, { selector: '' })).toEqual('content');
  });
  test('returns node label when selector is a chain', () => {
    const { container } = render(
      <div>
        <div id="target">
          <div>content</div>
          <div className="label-class">
            <div>second content</div>
            <h1>label to return</h1>
          </div>
        </div>
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;

    expect(processLabel(target, '.label-class h1')).toEqual('label to return');
    expect(processLabel(target, { selector: '.label-class h1' })).toEqual('label to return');
  });
  test('returns first non-empty label when selector is an array', () => {
    const { container } = render(
      <div>
        <div id="target">
          <div>content</div>
          <div className="label-class">
            <div>second content</div>
            <h1>heading1</h1>
            <h2></h2>
            <h3>heading3</h3>
          </div>
        </div>
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;

    expect(processLabel(target, { selector: ['.label-class h1', '.label-class h2', '.label-class h3'] })).toEqual(
      'heading1'
    );
    expect(
      processLabel(target, { selector: ['.label-wrong-class h1', '.label-wrong-class h2', '.label-class h3'] })
    ).toEqual('heading3');
    expect(processLabel(target, { selector: ['.label-class h2', '.label-class h3'] })).toEqual('heading3');
  });
  test('respects the root property', () => {
    const { container } = render(
      <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })}>
        <div className="label-class">outer label</div>
        <div id="target">
          <div className="label-class">inner label</div>
        </div>
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;
    //  root="self" refers to the element containing the data attribute
    expect(processLabel(target, { selector: '.label-class', root: 'self' })).toEqual('inner label');
    //  root="self" refers to the parent component
    expect(processLabel(target, { selector: '.label-class', root: 'component' })).toEqual('outer label');
  });

  test('forwards the label resolution with data-awsui-analytics-label', () => {
    const { container } = render(
      <div>
        <div {...getAnalyticsMetadataAttribute({ component: { name: 'FirstComponentName' } })}>
          <div id="target1">
            <div className="redirect-label-class-one" {...getAnalyticsLabelAttribute('#target2 .label-class')}>
              <div id="target2">
                <div className="label-class">second inner label</div>
              </div>
            </div>
            <div className="redirect-label-class-two" {...getAnalyticsLabelAttribute('h1')}>
              <h1>heading1</h1>
              <h2>heading2</h2>
            </div>
            <div className="redirect-label-class-three" {...getAnalyticsLabelAttribute('')}>
              <h1>heading1</h1>
              <h2>heading2</h2>
            </div>
            <div className="redirect-label-class-four" {...getAnalyticsLabelAttribute('h2')}>
              <h1>heading1</h1>
              <h2 {...getAnalyticsLabelAttribute('.text-content')}>
                <span className="text-content">content inside header</span>
                <span>other content</span>
              </h2>
            </div>
            <div className="redirect-label-class-five" {...getAnalyticsLabelAttribute('h2')}>
              <h1>heading1</h1>
              <h2 {...getAnalyticsLabelAttribute('.wonrg-text-content')}>
                <span className="text-content">content inside header</span>
                <span>other content</span>
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
    const target = container.querySelector('#target1') as HTMLElement;

    expect(processLabel(target, '.redirect-label-class-one')).toEqual('second inner label');
    expect(processLabel(target, '.redirect-label-class-two')).toEqual('heading1');
    expect(processLabel(target, '.redirect-label-class-three')).toEqual('heading1heading2');
    expect(processLabel(target, '.redirect-label-class-four')).toEqual('content inside header');
    expect(processLabel(target, '.redirect-label-class-five')).toEqual('');
  });
});
