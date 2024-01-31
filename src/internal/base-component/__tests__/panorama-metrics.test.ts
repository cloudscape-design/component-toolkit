// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PanoramaClient } from '../metrics/log-clients';

declare global {
  interface Window {
    panorama?: any;
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
    panorama.sendMetric({ eventType: 'custom', eventValue: 'value' });

    expect(window.panorama).toHaveBeenCalledWith(
      'trackCustomEvent',
      expect.objectContaining({ eventType: 'custom', eventValue: 'value' })
    );
  });

  test('converts objects to strings', () => {
    panorama.sendMetric({ eventType: 'custom', eventValue: { test: 'value' }, eventDetail: { test: 'detail' } });

    expect(window.panorama).toHaveBeenCalledWith(
      'trackCustomEvent',
      expect.objectContaining({ eventType: 'custom', eventValue: '{"test":"value"}', eventDetail: '{"test":"detail"}' })
    );
  });

  test('prints an error when event details are too long', () => {
    const eventDetail = 'a'.repeat(4001);
    panorama.sendMetric({ eventType: 'custom', eventDetail });

    expect(window.panorama).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(`Event detail for metric is too long: ${eventDetail}`);
  });

  test('prints an error when event type is too long', () => {
    const eventType = 'a'.repeat(51);
    panorama.sendMetric({ eventType });

    expect(window.panorama).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(`Event type for metric is too long: ${eventType}`);
  });

  test('prints an error when event value is too long', () => {
    const eventValue = 'a'.repeat(4001);
    panorama.sendMetric({ eventValue });

    expect(window.panorama).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(`Event value for metric is too long: ${eventValue}`);
  });

  test('prints an error when event context is too long', () => {
    const eventContext = 'a'.repeat(4001);
    panorama.sendMetric({ eventContext });

    expect(window.panorama).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(`Event context for metric is too long: ${eventContext}`);
  });
});
