// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PanoramaClient } from '../metrics/log-clients';

declare global {
  interface Window {
    panorama?: any;
    [key: symbol]: any;
  }
}

describe('PanoramaClient', () => {
  const panorama = new PanoramaClient();
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    window.panorama = jest.fn();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sends simple metrics', () => {
    panorama.sendMetric({ eventValue: 'value' });

    expect(window.panorama).toHaveBeenCalledWith(
      'trackCustomEvent',
      expect.objectContaining({ eventType: 'awsui', eventValue: 'value' })
    );
  });

  test('converts objects to strings', () => {
    panorama.sendMetric({ eventValue: { test: 'value' }, eventDetail: { test: 'detail' } });

    expect(window.panorama).toHaveBeenCalledWith(
      'trackCustomEvent',
      expect.objectContaining({ eventValue: '{"test":"value"}', eventDetail: '{"test":"detail"}' })
    );
  });

  test('prints an error when event details are too long', () => {
    const eventDetail = 'a'.repeat(4001);
    panorama.sendMetric({ eventContext: 'custom', eventDetail });

    expect(window.panorama).toHaveBeenCalledTimes(1);
    expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
      eventType: 'awsui',
      eventContext: 'awsui-metric-error',
      eventDetail: expect.stringMatching(/Event detail for metric is too long:.*/),
      timestamp: expect.any(Number),
    });
    expect(consoleSpy).toHaveBeenCalledWith(`Event detail for metric is too long: ${eventDetail}`);
  });

  test('prints an error when event value is too long', () => {
    const eventValue = 'a'.repeat(4001);
    panorama.sendMetric({ eventValue });

    expect(window.panorama).toHaveBeenCalledTimes(1);
    expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
      eventType: 'awsui',
      eventContext: 'awsui-metric-error',
      eventDetail: expect.stringMatching(/Event value for metric is too long:.*/),
      timestamp: expect.any(Number),
    });
    expect(consoleSpy).toHaveBeenCalledWith(`Event value for metric is too long: ${eventValue}`);
  });

  test('prints an error when event context is too long', () => {
    const eventContext = 'a'.repeat(4001);
    panorama.sendMetric({ eventContext });

    expect(window.panorama).toHaveBeenCalledTimes(1);
    expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
      eventType: 'awsui',
      eventContext: 'awsui-metric-error',
      eventDetail: expect.stringMatching(/Event context for metric is too long:.*/),
      timestamp: expect.any(Number),
    });
    expect(consoleSpy).toHaveBeenCalledWith(`Event context for metric is too long: ${eventContext}`);
  });

  test('forwards custom timestamps', () => {
    panorama.sendMetric({ timestamp: 15 });
    expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', expect.objectContaining({ timestamp: 15 }));
  });

  test('finds panorama function from Symbol.for("panorama") property', () => {
    // Remove the regular panorama property
    delete window.panorama;

    const mockPanoramaSymbolFn = jest.fn();
    const panoramaSymbol = Symbol.for('panorama');
    (window as any)[panoramaSymbol] = mockPanoramaSymbolFn;

    panorama.sendMetric({ eventValue: 'symbol-test' });

    expect(mockPanoramaSymbolFn).toHaveBeenCalledWith(
      'trackCustomEvent',
      expect.objectContaining({ eventType: 'awsui', eventValue: 'symbol-test' })
    );
  });
});
