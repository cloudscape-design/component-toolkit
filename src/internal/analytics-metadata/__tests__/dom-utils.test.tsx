// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { activateAnalyticsMetadata, getAnalyticsMetadataAttribute, METADATA_ATTRIBUTE } from '../attributes';
import { findLogicalParent, isNodeComponent, findComponentUp, findSelectorUp, findPortals } from '../dom-utils';

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

describe('findSelectorUp', () => {
  test('returns null when the node is null or the className is invalid', () => {
    expect(findSelectorUp(null, 'abcd')).toBeNull();
    const { container } = render(
      <div id="root-element">
        <div id="target-element"></div>
      </div>
    );
    expect(findSelectorUp(container.querySelector('#target-element'), '.dummy')).toBeNull();
  });
  test('returns root element', () => {
    const { container } = render(
      <div id="root-element" className="test-class">
        <div id="target-element"></div>
      </div>
    );
    expect(findSelectorUp(container.querySelector('#target-element'), '.test-class')!.id).toBe('root-element');
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
    expect(findSelectorUp(container.querySelector('#target-element'), '.test-class')!.id).toBe('root-element');
  });
  test('returns null when element has no parent element with className', () => {
    const { container } = render(
      <div>
        <div id="target-element"></div>
      </div>
    );
    expect(findSelectorUp(container.querySelector('#target-element'), '.test-class')).toBeNull();
  });
});

describe('findPortals', () => {
  test('returns an empty array when no referrerId is found', () => {
    const { container } = render(<div id="root-element"></div>);
    expect(findPortals(container.querySelector('#root-element')!)).toEqual([]);
  });
  test('returns an empty array when no portal is found', () => {
    const { container } = render(
      <div id="root-element">
        <div data-awsui-referrer-id="id:portal"></div>
      </div>
    );
    expect(findPortals(container.querySelector('#root-element')!)).toEqual([]);
  });
  test('returns one portal', () => {
    const { container } = render(
      <div id="root-element">
        <div data-awsui-referrer-id="id:portal"></div>
        <div id="id:portal" className="portal"></div>
      </div>
    );
    expect(findPortals(container.querySelector('#root-element')!)).toEqual([container.querySelector('.portal')]);
  });
  test('returns multiple portals', () => {
    const { container } = render(
      <>
        <div id="id:portal-2" className="portal-2"></div>
        <div id="id:portal-3" className="portal-3"></div>
        <div id="root-element">
          <div data-awsui-referrer-id="id:portal-1"></div>
          <div id="id:portal-1" className="portal-1"></div>
          <div data-awsui-referrer-id="id:portal-2"></div>
          <div data-awsui-referrer-id="id:portal-3"></div>
        </div>
      </>
    );
    expect(findPortals(container.querySelector('#root-element')!)).toEqual(
      [1, 2, 3].map(index => container.querySelector(`.portal-${index}`))
    );
  });
  test('returns only portals contained in the specified elements', () => {
    const { container } = render(
      <div id="root-element">
        <div data-awsui-referrer-id="id:portal-1"></div>
        <div id="id:portal-1" className="portal-1"></div>
        <div id="target-element">
          <div data-awsui-referrer-id="id:portal-2"></div>
        </div>
        <div id="id:portal-2" className="portal-2"></div>
        <div data-awsui-referrer-id="id:portal-3"></div>
        <div id="id:portal-3" className="portal-3"></div>
      </div>
    );
    expect(findPortals(container.querySelector('#target-element')!)).toEqual([container.querySelector('.portal-2')]);
  });
});
