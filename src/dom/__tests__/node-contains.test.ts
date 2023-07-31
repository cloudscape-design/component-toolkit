// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import nodeContains from '../node-contains';

test('returns false if either node is null', () => {
  const div = document.createElement('div');
  expect(nodeContains(div, null)).toBe(false);
  expect(nodeContains(null, div)).toBe(false);
  expect(nodeContains(null, null)).toBe(false);
});

// useful for passing `event.target` or `event.relatedTarget` without additional processing
test('returns false if descendant is not a valid node', () => {
  const div = document.createElement('div');
  expect(nodeContains(div, window)).toBe(false);
  expect(nodeContains(div, new EventTarget())).toBe(false);
});

const testCases: Record<string, string> = {
  regular: `<div id="parent">
    <div id="inbetween">
      <div id="child"></div>
    </div>
  </div>
`,
  svg: `<svg>
    <g id="parent">
      <g id="inbetween">
        <g id="child"></g>
      </g>
    </g>
  </svg>
`,
  mixed: `<div id="parent">
    <svg id="inbetween">
      <g id="child"></g>
    </svg>
  </div>
`,
};

Object.keys(testCases).forEach(title => {
  test(`finds ${title} nested nodes`, () => {
    const div = document.createElement('div');
    /* eslint-disable-next-line no-unsanitized/property */
    div.innerHTML = testCases[title];

    const parent = div.querySelector('#parent');
    const inbetween = div.querySelector('#inbetween');
    const child = div.querySelector('#child');

    expect(nodeContains(parent, parent)).toBe(true);
    expect(nodeContains(child, child)).toBe(true);
    expect(nodeContains(parent, child)).toBe(true);
    expect(nodeContains(parent, inbetween)).toBe(true);
    expect(nodeContains(inbetween, child)).toBe(true);
    expect(nodeContains(child, parent)).toBe(false);
    expect(nodeContains(child, inbetween)).toBe(false);
    expect(nodeContains(inbetween, parent)).toBe(false);
  });
});
