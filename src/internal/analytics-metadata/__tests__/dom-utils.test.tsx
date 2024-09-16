// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { activateAnalyticsMetadata, getAnalyticsMetadataAttribute, METADATA_ATTRIBUTE } from '../attributes';
import { findLogicalParent, isNodeComponent, findComponentUp, findByClassNameUp } from '../dom-utils';

beforeAll(() => {
  activateAnalyticsMetadata(true);
});

describe('findLogicalParent', () => {
  test('finds parent', () => {
    const { container } = render(
      <div id="parent">
        <div id="child"></div>
      </div>
    );
    const child = container.querySelector('#child');
    expect(findLogicalParent(child as HTMLElement)!.id).toEqual('parent');
  });
  test('returns null when child does not exist', () => {
    const { container } = render(
      <div id="parent">
        <div id="child"></div>
      </div>
    );
    const child = container.querySelector('#wrong-child');
    expect(findLogicalParent(child as HTMLElement)).toBeNull();
  });
  test('returns null when parent does not exist', () => {
    const { container } = render(
      <div id="parent">
        <div id="child"></div>
      </div>
    );
    expect(findLogicalParent(container.parentElement?.parentElement as HTMLElement)).toBeNull();
  });
  test('returns element referred to with referrerId', () => {
    const { container } = render(
      <div>
        <div id="child" data-awsui-referrer-id="id:rr5:"></div>
        <div id="id:rr5:" className="parent"></div>
      </div>
    );
    const child = container.querySelector('#child');
    expect(findLogicalParent(child as HTMLElement)?.classList.contains('parent')).toBe(true);
  });
  test('returns null when element referred to with referrerId does not exist', () => {
    const { container } = render(
      <div>
        <div id="child" data-awsui-referrer-id="id:rr5:"></div>
        <div id="id:rr5:wrong" className="parent"></div>
      </div>
    );
    const child = container.querySelector('#child');
    expect(findLogicalParent(child as HTMLElement)).toBeNull();
  });
});

describe('isNodeComponent', () => {
  test('returns false when element has no component metadata', () => {
    const { container } = render(<div />);
    expect(isNodeComponent(container.firstElementChild as HTMLElement)).toBe(false);
  });
  test('returns true when element has component metadata with component name', () => {
    const { container } = render(<div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })} />);
    expect(isNodeComponent(container.firstElementChild as HTMLElement)).toBe(true);
  });
  test('returns false when element has component metadata without component name', () => {
    const { container } = render(<div {...getAnalyticsMetadataAttribute({ component: { label: 'labelSelector' } })} />);
    expect(isNodeComponent(container.firstElementChild as HTMLElement)).toBe(false);
  });
  test('returns false when element has corrupted metadata', () => {
    const { container } = render(<div {...{ [METADATA_ATTRIBUTE]: "{'corruptedJSON':}" }} />);
    expect(isNodeComponent(container.firstElementChild as HTMLElement)).toBe(false);
  });
});

describe('findComponentUp', () => {
  test('returns null when input is null', () => {
    expect(findComponentUp(null)).toBeNull();
  });
  test('returns parent component element', () => {
    const { container } = render(
      <div id="component-element" {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })}>
        <div id="target-element"></div>
      </div>
    );
    expect(findComponentUp(container.querySelector('#target-element'))!.id).toBe('component-element');
  });
  test('returns parent component element with portals', () => {
    const { container } = render(
      <div>
        <div id="component-element" {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })}>
          <div id=":rr5:"></div>
        </div>
        <div data-awsui-referrer-id=":rr5:">
          <div id="target-element"></div>
        </div>
      </div>
    );
    expect(findComponentUp(container.querySelector('#target-element'))!.id).toBe('component-element');
  });
  test('returns null when element has no parent component', () => {
    const { container } = render(
      <div>
        <div id="target-element"></div>
      </div>
    );
    expect(findComponentUp(container.querySelector('#target-element'))).toBeNull();
  });
});

describe('findByClassNameUp', () => {
  test('returns null when the node is null and/or the className is empty', () => {
    expect(findByClassNameUp(null, 'abcd')).toBeNull();
    expect(findByClassNameUp(null, '')).toBeNull();
    const { container } = render(
      <div id="root-element">
        <div id="target-element"></div>
      </div>
    );
    expect(findByClassNameUp(container.querySelector('#target-element'), '')).toBeNull();
  });
  test('returns root element', () => {
    const { container } = render(
      <div id="root-element" className="test-class">
        <div id="target-element"></div>
      </div>
    );
    expect(findByClassNameUp(container.querySelector('#target-element'), '.test-class')!.id).toBe('root-element');
  });
  test('returns parent component element with portals', () => {
    const { container } = render(
      <div>
        <div id="root-element" className="test-class">
          <div id=":rr5:"></div>
        </div>
        <div data-awsui-referrer-id=":rr5:">
          <div id="target-element"></div>
        </div>
      </div>
    );
    expect(findByClassNameUp(container.querySelector('#target-element'), '.test-class')!.id).toBe('root-element');
  });
  test('returns null when element has no parent element with className', () => {
    const { container } = render(
      <div>
        <div id="target-element"></div>
      </div>
    );
    expect(findByClassNameUp(container.querySelector('#target-element'), '.test-class')).toBeNull();
  });
});
