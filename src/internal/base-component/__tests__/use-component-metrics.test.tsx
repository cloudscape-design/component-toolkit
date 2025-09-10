// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { clearOneTimeMetricsCache } from '../metrics/metrics';
import { useComponentMetrics } from '../component-metrics';

declare global {
  interface Window {
    AWSC?: any;
    AWSUI_METRIC_ORIGIN?: string;
  }
}

function TestComponent1() {
  useComponentMetrics('test-component-1', { packageSource: 'toolkit', packageVersion: '3.0.0', theme: 'test' });
  return <div>Test 1</div>;
}
function TestComponent2() {
  useComponentMetrics('test-component-2', { packageSource: 'toolkit', packageVersion: '3.0.0', theme: 'test' });
  return <div>Test 2</div>;
}
function TestComponentWithProps({ variant }: { variant: string }) {
  useComponentMetrics(
    'test-component-with-props',
    {
      packageSource: 'toolkit',
      packageVersion: '3.0.0',
      theme: 'test',
    },
    {
      props: { variant },
    }
  );
  return <div>Dummy content</div>;
}

function verifyMetricsAreLoggedOnlyOnce() {
  const callCount = window.AWSC.Clog.log.mock.calls.length;
  const metricNames = window.AWSC.Clog.log.mock.calls.map((call: any) => {
    return call[0];
  });
  expect(new Set(metricNames).size === callCount).toBeTruthy();
}

function getExpectedMetricName(componentName: string) {
  return `awsui_${componentName}_t30`;
}

describe('useComponentMetrics', () => {
  const componentRoot = document.createElement('div');
  document.body.appendChild(componentRoot);

  window.AWSC = {
    Clog: {
      log: () => {},
    },
  };

  beforeEach(() => {
    jest.spyOn(window.AWSC.Clog, 'log');
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearOneTimeMetricsCache();
  });

  test('component issues metrics upon rendering', () => {
    const component = <TestComponent1 />;
    const { rerender } = render(component, { container: componentRoot });

    // on the first render the metrics got sent
    const callCount = window.AWSC.Clog.log.mock.calls.length;
    // the order is defined in the telemetry hook
    expect(window.AWSC.Clog.log).toHaveBeenNthCalledWith(1, 'awsui-viewport-width', 1024, undefined);
    expect(window.AWSC.Clog.log).toHaveBeenNthCalledWith(2, 'awsui-viewport-height', 768, undefined);
    expect(window.AWSC.Clog.log).toHaveBeenNthCalledWith(3, 'awsui_toolkit_t30', 1, expect.stringContaining('loaded'));
    expect(window.AWSC.Clog.log).toHaveBeenLastCalledWith(
      getExpectedMetricName('test-component-1'),
      1,
      JSON.stringify({
        o: 'main',
        t: 'test',
        f: 'react',
        v: '3.0.0',
        a: 'used',
        s: 'test-component-1',
        p: 'toolkit',
        c: { props: {} },
      })
    );

    verifyMetricsAreLoggedOnlyOnce();

    // on the second render no logs should get sent
    rerender(component);
    expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(callCount);
  });

  test('one-time metrics (viewport, component usage) do not repeat', () => {
    render(<TestComponent1 />);
    window.AWSC.Clog.log.mockClear();
    render(<TestComponent2 />);
    expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(1);
    expect(window.AWSC.Clog.log).toHaveBeenCalledWith(
      getExpectedMetricName('test-component-2'),
      1,
      JSON.stringify({
        o: 'main',
        t: 'test',
        f: 'react',
        v: '3.0.0',
        a: 'used',
        s: 'test-component-2',
        p: 'toolkit',
        c: { props: {} },
      })
    );
  });

  test('reports metric for different component props', () => {
    // render another component to report one-time metrics
    render(<TestComponent1 />);
    window.AWSC.Clog.log.mockClear();

    // render the actual component for testing
    render(<TestComponentWithProps variant="primary" />);
    const metricName = getExpectedMetricName('test-component-with-props');
    const commonDetails = {
      o: 'main',
      t: 'test',
      f: 'react',
      v: '3.0.0',
      a: 'used',
      s: 'test-component-with-props',
      p: 'toolkit',
    };
    expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(1);
    expect(window.AWSC.Clog.log).toHaveBeenCalledWith(
      metricName,
      1,
      JSON.stringify({ ...commonDetails, c: { props: { variant: 'primary' } } })
    );
    render(<TestComponentWithProps variant="secondary" />);
    expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(2);
    expect(window.AWSC.Clog.log).toHaveBeenCalledWith(
      metricName,
      1,
      JSON.stringify({ ...commonDetails, c: { props: { variant: 'secondary' } } })
    );
    // this render does not report metrics because this variant was already reported
    render(<TestComponentWithProps variant="primary" />);
    expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(2);
  });

  test('supports custom origin', () => {
    window.AWSUI_METRIC_ORIGIN = 'custom';
    render(<TestComponent1 />);
    expect(window.AWSC.Clog.log).toHaveBeenCalledWith(
      getExpectedMetricName('test-component-1'),
      1,
      JSON.stringify({
        o: 'custom',
        t: 'test',
        f: 'react',
        v: '3.0.0',
        a: 'used',
        s: 'test-component-1',
        p: 'toolkit',
        c: { props: {} },
      })
    );
  });
});
