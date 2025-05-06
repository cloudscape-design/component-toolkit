// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';

import { useMergeRefs } from '../index';

const DemoNull = React.forwardRef((props, ref) => {
  const mergedRef = useMergeRefs(null, ref, undefined);
  return (
    <>
      <div ref={mergedRef} className="target"></div>
    </>
  );
});

const Demo = React.forwardRef((props, ref) => {
  const ref2 = React.createRef<HTMLDivElement>();
  const mergedRef = useMergeRefs(ref, ref2);
  return (
    <>
      <div ref={mergedRef} className="target"></div>
    </>
  );
});

describe('use merge refs', function () {
  it('does not cause component to crash when all refs are null or undefined', () => {
    render(<DemoNull ref={null} />);
    expect(document.querySelector('.target')).not.toBe(null);
  });

  it('merges ref with null refs', () => {
    const ref1 = React.createRef<HTMLDivElement>();
    render(<DemoNull ref={ref1} />);
    expect(ref1.current!.classList).toContain('target');
  });

  it('merges two refs', () => {
    const ref1 = React.createRef<HTMLDivElement>();
    render(<Demo ref={ref1} />);
    expect(ref1.current!.classList).toContain('target');
  });

  it('ref callback has been called', () => {
    const ref1 = jest.fn();
    render(<Demo ref={ref1} />);
    expect(ref1).toHaveBeenCalledTimes(1);
    expect(ref1).toHaveBeenCalledWith(expect.objectContaining({ className: 'target' }));
  });
});
