// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import findUpUntil from '../find-up-until';

test('returns null if there is no match', () => {
  const div = document.createElement('div');
  expect(findUpUntil(div, () => false)).toBeNull();
});

test('returns the first match if there are multiple', () => {
  const div = document.createElement('div');
  div.innerHTML = `
    <div id="first" class="match">
      <div id="second" class="match"><div id="target"></div></div>
    </div>
  `;
  expect(findUpUntil(div.querySelector<HTMLElement>('#target')!, node => node.className === 'match')).toEqual(
    expect.objectContaining({ id: 'second' })
  );
});

test('returns the input node if it matches the criteria', () => {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="match">
      <div class="match" id="target"></div>
    </div>
  `;
  expect(findUpUntil(div.querySelector<HTMLElement>('#target')!, node => node.className === 'match')).toEqual(
    expect.objectContaining({ id: 'target' })
  );
});

test('skips non-HTMLElement parents', () => {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="match" id="match">
      <svg>
        <foreignObject>
          <div id="target"></div>
        </foreignObject>
      </svg>
    </div>
  `;
  expect(
    findUpUntil(div.querySelector<HTMLElement>('#target')!, node => {
      expect(node.tagName).not.toBe('foreignObject');
      return !!node.className.match(/match/);
    })
  ).toEqual(expect.objectContaining({ id: 'match' }));
});
