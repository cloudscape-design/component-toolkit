// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import nodeContains from '../node-contains';

test('returns false if either node is null', () => {
  const div = document.createElement('div');
  expect(nodeContains(div, null)).toBe(false);
  expect(nodeContains(null, div)).toBe(false);
  expect(nodeContains(null, null)).toBe(false);
});

const testCases: Record<string, string> = {
  regular: `<div id="parent">
              <div id="inbetween">
                <div id="child"></div>
              </div>
            </div>
`,
  svg: `<g id="parent">
          <g id="inbetween">
            <g id="child"></g>
          </g>
        </g>
`,
  mixed: `<div id="parent">
            <svg id="inbetween">
              <g id="child"></g>
            </svg>
          </div>
`,
};

[false, true].forEach(nativeContains => {
  describe(`with${!nativeContains ? 'out' : ''} native .contains method`, () => {
    let oldContains: Element['contains'];

    // The utility can use two possible algorithms: native .contains or a fallback approach using loops.
    // In order to cover both use cases in the tests, we need to temporarily remove the contains function.
    beforeAll(() => {
      if (!nativeContains) {
        oldContains = window.Element.prototype.contains;
        (window.Element.prototype.contains as any) = undefined;
      }
    });
    afterAll(() => {
      if (!nativeContains) {
        window.Element.prototype.contains = oldContains;
      }
    });

    Object.keys(testCases).forEach(title => {
      test(`finds ${title} nested nodes`, () => {
        const div = document.createElement('div');
        /* eslint-disable-next-line no-unsanitized/property */
        div.innerHTML = testCases[title];

        const parent = div.querySelector('#parent');
        const inbetween = div.querySelector('#inbetween');
        const child = div.querySelector('#child');

        expect(nodeContains(parent, child)).toBe(true);
        expect(nodeContains(parent, inbetween)).toBe(true);
        expect(nodeContains(inbetween, child)).toBe(true);
        expect(nodeContains(child, parent)).toBe(false);
        expect(nodeContains(child, inbetween)).toBe(false);
      });
    });
  });
});
