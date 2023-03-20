// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { render } from '@testing-library/react';
import { MetricsTestHelper } from '../metrics/metrics';
import { formatVersionForMetricName, formatMajorVersionForMetricDetail } from '../metrics/formatters';
import { useComponentMetrics } from '../component-metrics';
import { PanoramaClient } from '../metrics/log-clients';

declare global {
  interface Window {
    AWSC?: any;
    AWSUI_METRIC_ORIGIN?: string;
    panorama?: any;
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

function verifyMetricsAreLoggedOnlyOnce() {
  const callCount = window.AWSC.Clog.log.mock.calls.length;
  const metricNames = window.AWSC.Clog.log.mock.calls.map((call: any) => {
    return call[0];
  });
  expect(new Set(metricNames).size === callCount).toBeTruthy();
}

function getExpectedMetricName(componentName: string) {
  return `awsui_${componentName}_${formatVersionForMetricName('test', '3.0.0')}`;
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
    new MetricsTestHelper().resetOneTimeMetricsCache();
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
        s: 'test-component-1',
        t: 'test',
        a: 'used',
        f: 'react',
        v: formatMajorVersionForMetricDetail('3.0.0'),
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
        s: 'test-component-2',
        t: 'test',
        a: 'used',
        f: 'react',
        v: formatMajorVersionForMetricDetail('3.0.0'),
      })
    );
  });

  test('supports custom origin', () => {
    window.AWSUI_METRIC_ORIGIN = 'custom';
    render(<TestComponent1 />);
    expect(window.AWSC.Clog.log).toHaveBeenCalledWith(
      getExpectedMetricName('test-component-1'),
      1,
      JSON.stringify({
        o: 'custom',
        s: 'test-component-1',
        t: 'test',
        a: 'used',
        f: 'react',
        v: formatMajorVersionForMetricDetail('3.0.0'),
      })
    );
  });
});

describe('PanoramaClient', () => {
  const panorama = new PanoramaClient();
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    window.panorama = jest.fn();
    consoleSpy = jest.spyOn(console, 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends simple metrics', () => {
    panorama.sendMetric({ eventType: 'custom', eventValue: 'value' });

    expect(window.panorama).toHaveBeenCalledWith(
      'trackCustomEvent',
      expect.objectContaining({ eventType: 'custom', eventValue: 'value' })
    );
  });

  it('converts objects to strings', () => {
    panorama.sendMetric({ eventType: 'custom', eventValue: { test: 'value' }, eventDetail: { test: 'detail' } });

    expect(window.panorama).toHaveBeenCalledWith(
      'trackCustomEvent',
      expect.objectContaining({ eventType: 'custom', eventValue: '{"test":"value"}', eventDetail: '{"test":"detail"}' })
    );
  });

  it('prints error when the details are too long', () => {
    const eventDetail = new Array(202).join('a');
    panorama.sendMetric({ eventType: 'custom', eventDetail });

    expect(window.panorama).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(`Detail for metric is too long: ${eventDetail}`);
  });
});
