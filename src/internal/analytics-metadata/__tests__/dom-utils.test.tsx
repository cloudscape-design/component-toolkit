// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { activateAnalyticsMetadata, getAnalyticsMetadataAttribute, METADATA_ATTRIBUTE } from '../attributes';
import { findLogicalParent, isNodeComponent, findComponentUpUntil, findSelectorUp } from '../dom-utils';

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

describe('findComponentUpUntil', () => {
  test('returns null when input is null', () => {
    expect(findComponentUpUntil(null)).toBeNull();
  });
  test('returns parent component element', () => {
    const { container } = render(
      <div id="component-element" {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })}>
        <div id="target-element"></div>
      </div>
    );
    expect(findComponentUpUntil(container.querySelector('#target-element'))!.id).toBe('component-element');
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
    expect(findComponentUpUntil(container.querySelector('#target-element'))!.id).toBe('component-element');
  });
  test('returns null when element has no parent component', () => {
    const { container } = render(
      <div>
        <div id="target-element"></div>
      </div>
    );
    expect(findComponentUpUntil(container.querySelector('#target-element'))).toBeNull();
  });
  test('with `until` argument', () => {
    const { container } = render(
      <>
        <div id="outer-element">
          <div id="component-element" {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })}>
            <div id="another-until">
              <div id=":rr5:"></div>
            </div>
            <div id="target-element"></div>
          </div>
        </div>
        <div data-awsui-referrer-id=":rr5:">
          <div id="another-target-element"></div>
        </div>
      </>
    );
    expect(
      findComponentUpUntil(
        container.querySelector('#target-element'),
        container.querySelector('#outer-element') as HTMLElement
      )!.id
    ).toBe('component-element');
    expect(
      findComponentUpUntil(
        container.querySelector('#target-element'),
        container.querySelector('#target-element') as HTMLElement
      )
    ).toBeNull();
    expect(
      findComponentUpUntil(
        container.querySelector('#target-element'),
        container.querySelector('#component-element') as HTMLElement
      )!.id
    ).toBe('component-element');
    expect(
      findComponentUpUntil(
        container.querySelector('#another-target-element'),
        container.querySelector('#outer-element') as HTMLElement
      )!.id
    ).toBe('component-element');
    expect(
      findComponentUpUntil(
        container.querySelector('#another-target-element'),
        container.querySelector('#another-until') as HTMLElement
      )
    ).toBeNull();
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
