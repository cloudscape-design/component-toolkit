// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useLayoutEffect, useRef, useState } from 'react';
import { isMotionDisabled, useCurrentMode, useDensityMode, useReducedMotion } from '../index';
import { render, screen } from '@testing-library/react';
import { mutate } from './utils';

function ModeRender({ testId }: { testId: string }) {
  const ref = useRef(null);
  const colorMode = useCurrentMode(ref);
  const densityMode = useDensityMode(ref);
  return (
    <div ref={ref} data-testid={testId}>
      {colorMode}-{densityMode}
    </div>
  );
}

/** Renders `count` detectors under a shared ancestor chain of the given depth. */
function ManyDetectors({ count, depth }: { count: number; depth: number }) {
  let tree = (
    <>
      {Array.from({ length: count }, (_, i) => (
        <ModeRender key={i} testId={`detector-${i}`} />
      ))}
    </>
  );
  for (let i = 0; i < depth; i++) {
    tree = <div className={`level-${i}`}>{tree}</div>;
  }
  return tree;
}

function spyOnClassListReads() {
  const spy = jest.fn();
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'classList')!;
  jest.spyOn(Element.prototype, 'classList', 'get').mockImplementation(function (this: Element) {
    spy();
    return descriptor.get!.call(this);
  });
  return spy;
}

afterEach(() => {
  jest.restoreAllMocks();
  // Reset shared state explicitly rather than in each test, so that one failing assertion
  // cannot leave a mode class behind and cascade into unrelated failures.
  document.documentElement.className = '';
  document.body.className = '';
  document.body.replaceChildren();
});

describe('mode detection cost', () => {
  test('does not wake subscribers for attribute changes that cannot affect a mode', async () => {
    render(<ManyDetectors count={5} depth={3} />);

    const reads = spyOnClassListReads();
    await mutate(() => document.body.setAttribute('data-awsui-focus-visible', 'true'));
    expect(reads).not.toHaveBeenCalled();

    await mutate(() => document.body.removeAttribute('data-awsui-focus-visible'));
    expect(reads).not.toHaveBeenCalled();
  });

  test('shares ancestor lookups between subscribers within a single flush', async () => {
    const depth = 20;
    async function countReadsForOneFlush(detectorCount: number) {
      const { container, unmount } = render(<ManyDetectors count={detectorCount} depth={depth} />);
      const reads = spyOnClassListReads();
      await mutate(() => container.classList.add('unrelated-class'));
      const total = reads.mock.calls.length;
      jest.restoreAllMocks();
      unmount();
      return total;
    }

    const withForty = await countReadsForOneFlush(40);
    const withEighty = await countReadsForOneFlush(80);

    // Assert the marginal cost of one more subscriber, which is what memoization bounds.
    // Each additional subscriber should only read its own element's classList, once per
    // detected mode, because its ancestors were already resolved by an earlier subscriber.
    // Without memoization each one re-walks the shared chain instead, so the marginal cost
    // would scale with `depth`.
    const marginalReadsPerSubscriber = (withEighty - withForty) / 40;
    expect(marginalReadsPerSubscriber).toBeLessThan(depth / 2);
  });

  test('does not wake subscribers for node insertions that move no subscriber', async () => {
    render(<ManyDetectors count={5} depth={3} />);
    const unrelated = document.createElement('div');
    unrelated.appendChild(document.createElement('span'));
    document.body.appendChild(unrelated);
    await mutate(() => undefined);

    const reads = spyOnClassListReads();
    await mutate(() => unrelated.appendChild(document.createElement('span')));
    expect(reads).not.toHaveBeenCalled();

    await mutate(() => unrelated.firstElementChild!.remove());
    expect(reads).not.toHaveBeenCalled();
  });

  test('wakes subscribers when a childList change moves one of them', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(<ManyDetectors count={5} depth={3} />, { container: host });
    await mutate(() => undefined);

    const reads = spyOnClassListReads();
    // The subscribers sit below `host`, so re-parenting it changes their ancestor chains.
    const newParent = document.createElement('div');
    document.body.appendChild(newParent);
    await mutate(() => newParent.appendChild(host));
    expect(reads).toHaveBeenCalled();
  });

  test('wakes a subscriber inside a foreignObject when its svg is moved', async () => {
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNamespace, 'svg');
    const foreignObject = document.createElementNS(svgNamespace, 'foreignObject');
    const host = document.createElement('div');
    foreignObject.appendChild(host);
    svg.appendChild(foreignObject);
    document.body.appendChild(svg);
    const darkSubtree = document.createElement('div');
    darkSubtree.className = 'awsui-dark-mode';
    document.body.appendChild(darkSubtree);

    render(<ModeRender testId="detector" />, { container: host });
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');

    // The moved node is the <svg>, which is not an HTMLElement. The childList check has to
    // walk past it to find the subscriber below.
    await mutate(() => darkSubtree.appendChild(svg));
    expect(screen.getByTestId('detector')).toHaveTextContent('dark-comfortable');
  });

  test('detects a move that spans two flushes, reported as a removal then an insertion', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const darkSubtree = document.createElement('div');
    darkSubtree.className = 'awsui-dark-mode';
    document.body.appendChild(darkSubtree);

    render(<ModeRender testId="detector" />, { container: host });
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');

    // Detaching and re-attaching in separate flushes splits the move across two records, so
    // the insertion arrives without the matching removal to identify it by.
    await mutate(() => host.remove());
    await mutate(() => darkSubtree.appendChild(host));
    expect(screen.getByTestId('detector')).toHaveTextContent('dark-comfortable');
  });

  test('keeps detecting moves after a subscriber sharing the same ref unmounts', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const darkSubtree = document.createElement('div');
    darkSubtree.className = 'awsui-dark-mode';
    document.body.appendChild(darkSubtree);

    // The hooks take a ref rather than owning one, so two subscribers can share an element.
    function DensityOnSharedRef({ sharedRef }: { sharedRef: React.RefObject<HTMLElement> }) {
      return <span>{useDensityMode(sharedRef)}</span>;
    }

    let hideInner: () => void = () => undefined;
    function SharedRefDetectors() {
      const ref = useRef<HTMLDivElement>(null);
      const colorMode = useCurrentMode(ref);
      const [showInner, setShowInner] = useState(true);
      hideInner = () => setShowInner(false);
      return (
        <div ref={ref} data-testid="detector">
          {colorMode}
          {showInner && <DensityOnSharedRef sharedRef={ref} />}
        </div>
      );
    }

    render(<SharedRefDetectors />, { container: host });
    expect(screen.getByTestId('detector')).toHaveTextContent('light');

    // Unmounting one of the two must not discard the bookkeeping the other still needs.
    await mutate(() => hideInner());
    await mutate(() => darkSubtree.appendChild(host));
    expect(screen.getByTestId('detector')).toHaveTextContent('dark');
  });

  test('keeps detecting moves after a subscriber unmounts while detached', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const darkSubtree = document.createElement('div');
    darkSubtree.className = 'awsui-dark-mode';
    document.body.appendChild(darkSubtree);
    const staying = document.createElement('div');
    document.body.appendChild(staying);

    const leaving = render(<ModeRender testId="leaving" />, { container: host });
    render(<ModeRender testId="staying" />, { container: staying });
    await mutate(() => undefined);

    // Detach first, then unmount: the ancestor chain at cleanup time is not the one that was
    // recorded on mount, so the bookkeeping cannot be unwound along it.
    await mutate(() => host.remove());
    leaving.unmount();

    await mutate(() => darkSubtree.appendChild(staying));
    expect(screen.getByTestId('staying')).toHaveTextContent('dark-comfortable');
  });

  test('does not reuse cached lookups across separate flushes', async () => {
    const { container } = render(<ModeRender testId="detector" />);
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');

    await mutate(() => container.classList.add('awsui-dark-mode'));
    expect(screen.getByTestId('detector')).toHaveTextContent('dark-comfortable');

    await mutate(() => container.classList.add('awsui-compact-mode'));
    expect(screen.getByTestId('detector')).toHaveTextContent('dark-compact');

    await mutate(() => container.classList.remove('awsui-dark-mode', 'awsui-compact-mode'));
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');
  });

  test('resolves each subscriber independently when modes differ by subtree', () => {
    render(
      <>
        <div className="awsui-dark-mode">
          <ModeRender testId="in-dark" />
        </div>
        <div className="awsui-compact-mode">
          <ModeRender testId="in-compact" />
        </div>
        <ModeRender testId="in-neither" />
      </>
    );

    expect(screen.getByTestId('in-dark')).toHaveTextContent('dark-comfortable');
    expect(screen.getByTestId('in-compact')).toHaveTextContent('light-compact');
    expect(screen.getByTestId('in-neither')).toHaveTextContent('light-comfortable');
  });

  test('detects a mode class applied above body', async () => {
    render(<ModeRender testId="detector" />);
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');

    await mutate(() => document.documentElement.classList.add('awsui-dark-mode'));
    expect(screen.getByTestId('detector')).toHaveTextContent('dark-comfortable');

    await mutate(() => document.documentElement.classList.remove('awsui-dark-mode'));
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');
  });

  test('detects a move into a subtree with a different mode', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const darkSubtree = document.createElement('div');
    darkSubtree.className = 'awsui-dark-mode';
    document.body.appendChild(darkSubtree);

    render(<ModeRender testId="detector" />, { container: host });
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');

    // No class changes here: only the ancestor chain does.
    await mutate(() => darkSubtree.appendChild(host));
    expect(screen.getByTestId('detector')).toHaveTextContent('dark-comfortable');

    await mutate(() => document.body.appendChild(host));
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');
  });

  test('isMotionDisabled reads the live DOM when called during a fan-out', async () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    let observedDuringFlush: boolean | undefined = undefined;

    function MotionSubscriber() {
      const ref = useRef(null);
      useReducedMotion(ref);
      return <div ref={ref} />;
    }

    // This effect runs inside the fan-out, after MotionSubscriber has already resolved (and
    // cached) the motion lookup for the shared ancestor chain.
    function MutatingDuringFlush() {
      const ref = useRef<HTMLDivElement>(null);
      const colorMode = useCurrentMode(ref);
      useLayoutEffect(() => {
        if (colorMode === 'dark' && ref.current) {
          wrapper.classList.add('awsui-motion-disabled');
          observedDuringFlush = isMotionDisabled(ref.current);
        }
      }, [colorMode]);
      return <div ref={ref} />;
    }

    render(
      <>
        <MotionSubscriber />
        <MutatingDuringFlush />
      </>,
      { container: wrapper }
    );
    await mutate(() => wrapper.classList.add('awsui-dark-mode'));

    expect(observedDuringFlush).toBe(true);
  });

  test('detects a mode applied to an intermediate ancestor rather than body', async () => {
    const { container } = render(
      <div className="outer">
        <div className="inner">
          <ModeRender testId="detector" />
        </div>
      </div>
    );
    const inner = container.querySelector('.inner')!;

    await mutate(() => inner.classList.add('awsui-dark-mode'));
    expect(screen.getByTestId('detector')).toHaveTextContent('dark-comfortable');

    await mutate(() => inner.classList.remove('awsui-dark-mode'));
    expect(screen.getByTestId('detector')).toHaveTextContent('light-comfortable');
  });
});
