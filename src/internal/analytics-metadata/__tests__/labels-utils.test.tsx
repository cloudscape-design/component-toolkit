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
  test('returns text content aria-labelledby refers to the element itself', () => {
    const { container } = render(
      <div id="target" aria-labelledby="target">
        content
      </div>
    );
    const target = container.querySelector('#target');
    expect(getLabelFromElement(target as HTMLElement)).toEqual('content');
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
  test('returns node label when selector is undefined and has root="self" ', () => {
    const { container } = render(
      <div>
        <div id="target">content</div>
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;
    expect(processLabel(target, { root: 'self' })).toEqual('content');
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
      <>
        <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })}>
          <div className="label-class">outer label</div>
          <div id="target">
            <div className="label-class">inner label</div>
          </div>
        </div>
        <div className="outer-class">label outside of the component</div>
      </>
    );
    const target = container.querySelector('#target') as HTMLElement;
    //  root="self" refers to the element containing the data attribute
    expect(processLabel(target, { selector: '.label-class', root: 'self' })).toEqual('inner label');
    //  root="component" refers to the parent component
    expect(processLabel(target, { selector: '.label-class', root: 'component' })).toEqual('outer label');
    //  root="body" refers to body
    expect(processLabel(target, { selector: '.outer-class', root: 'body' })).toEqual('label outside of the component');
  });

  test('respects the rootSelector property', () => {
    const { container } = render(
      <div className="root-class">
        <div className="label-class">outer label</div>
        <div id="target">
          <div className="label-class">inner label</div>
        </div>
      </div>
    );
    const target = container.querySelector('#target') as HTMLElement;
    expect(processLabel(target, { selector: '.label-class', rootSelector: '.root-class' })).toEqual('outer label');
  });
  test('rootSelector prevails over root property', () => {
    const { container } = render(
      <>
        <div className="root-class">
          <div className="label-class">root class label</div>
          <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })}>
            <div className="label-class">component label</div>
            <div id="target">
              <div className="label-class">inner label</div>
            </div>
          </div>
        </div>
        <div className="outer-class">label outside of the component</div>
      </>
    );
    const target = container.querySelector('#target') as HTMLElement;
    expect(processLabel(target, { selector: '.label-class', root: 'self', rootSelector: '.root-class' })).toEqual(
      'root class label'
    );
    expect(processLabel(target, { selector: '.label-class', root: 'component', rootSelector: '.root-class' })).toEqual(
      'root class label'
    );
    expect(processLabel(target, { selector: '.outer-class', root: 'body', rootSelector: '.root-class' })).toEqual('');
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

  describe('with selectionMode parameter', () => {
    test('returns single label when selectionMode is "single" (default)', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
            <div className="item">Item 2</div>
            <div className="item">Item 3</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, '.item', 'single')).toEqual('Item 1');
      expect(processLabel(target, '.item')).toEqual('Item 1'); // default is 'single'
    });

    test('returns array of labels when selectionMode is "multi"', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
            <div className="item">Item 2</div>
            <div className="item">Item 3</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, '.item', 'multi')).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    test('returns empty array when no elements match in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, '.nonexistent', 'multi')).toEqual([]);
    });

    test('filters out empty labels in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
            <div className="item"></div>
            <div className="item">Item 3</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, '.item', 'multi')).toEqual(['Item 1', 'Item 3']);
    });

    test('handles nested label resolution in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item" {...getAnalyticsLabelAttribute('.nested')}>
              <span className="nested">Nested 1</span>
            </div>
            <div className="item" {...getAnalyticsLabelAttribute('.nested')}>
              <span className="nested">Nested 2</span>
            </div>
            <div className="item">Direct 3</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, '.item', 'multi')).toEqual(['Nested 1', 'Nested 2', 'Direct 3']);
    });

    test('flattens nested arrays from recursive processing in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item" {...getAnalyticsLabelAttribute('.nested')}>
              <span className="nested">Nested 1</span>
              <span className="nested">Nested 2</span>
            </div>
            <div className="item">Direct</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      const result = processLabel(target, '.item', 'multi');
      expect(Array.isArray(result)).toBe(true);
      expect((result as string[]).every(item => typeof item === 'string')).toBe(true);
    });

    test('handles aria-label in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item" aria-label="Label 1">
              Content 1
            </div>
            <div className="item" aria-label="Label 2">
              Content 2
            </div>
            <div className="item">Content 3</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, '.item', 'multi')).toEqual(['Label 1', 'Label 2', 'Content 3']);
    });

    test('works with LabelIdentifier object in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
            <div className="item">Item 2</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, { selector: '.item' }, 'multi')).toEqual(['Item 1', 'Item 2']);
    });

    test('returns empty array when selector is undefined in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, { selector: undefined }, 'multi')).toEqual([]);
    });

    test('returns empty array when labelIdentifier is null in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, null, 'multi')).toEqual([]);
    });

    test('returns empty array when node is null in multi mode', () => {
      expect(processLabel(null, '.item', 'multi')).toEqual([]);
    });

    test('returns first non-empty labels when selector is an array in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="wrong-class">Wrong 1</div>
            <div className="item">Item 1</div>
            <div className="item">Item 2</div>
            <div className="other">Other 1</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      // Should return first successful selector's results
      expect(processLabel(target, { selector: ['.nonexistent', '.item', '.other'] }, 'multi')).toEqual([
        'Item 1',
        'Item 2',
      ]);
    });

    test('returns empty array when all selectors in array fail in multi mode', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, { selector: ['.nonexistent1', '.nonexistent2', '.nonexistent3'] }, 'multi')).toEqual(
        []
      );
    });

    test('respects rootSelector property in multi mode', () => {
      const { container } = render(
        <div className="root-class">
          <div className="item">Root Item 1</div>
          <div className="item">Root Item 2</div>
          <div id="target">
            <div className="item">Inner Item 1</div>
            <div className="item">Inner Item 2</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, { selector: '.item', rootSelector: '.root-class' }, 'multi')).toEqual([
        'Root Item 1',
        'Root Item 2',
        'Inner Item 1',
        'Inner Item 2',
      ]);
    });

    test('respects root="component" property in multi mode', () => {
      const { container } = render(
        <>
          <div {...getAnalyticsMetadataAttribute({ component: { name: 'ComponentName' } })}>
            <div className="item">Component Item 1</div>
            <div className="item">Component Item 2</div>
            <div id="target">
              <div className="item">Inner Item 1</div>
              <div className="item">Inner Item 2</div>
            </div>
          </div>
        </>
      );
      const target = container.querySelector('#target') as HTMLElement;

      // querySelectorAll finds ALL descendants from the component root
      expect(processLabel(target, { selector: '.item', root: 'component' }, 'multi')).toEqual([
        'Component Item 1',
        'Component Item 2',
        'Inner Item 1',
        'Inner Item 2',
      ]);
    });

    test('respects root="body" property in multi mode', () => {
      const { container } = render(
        <>
          <div className="outer-item">Outer Item 1</div>
          <div className="outer-item">Outer Item 2</div>
          <div id="target">
            <div className="outer-item">Inner Item 1</div>
          </div>
        </>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, { selector: '.outer-item', root: 'body' }, 'multi')).toEqual([
        'Outer Item 1',
        'Outer Item 2',
        'Inner Item 1',
      ]);
    });
  });

  describe('edge cases with array selectors in single mode', () => {
    test('returns empty string when all selectors in array fail', () => {
      const { container } = render(
        <div>
          <div id="target">
            <div className="item">Item 1</div>
          </div>
        </div>
      );
      const target = container.querySelector('#target') as HTMLElement;

      expect(processLabel(target, { selector: ['.nonexistent1', '.nonexistent2'] })).toEqual('');
    });
  });
});
