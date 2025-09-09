// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { clearOneTimeMetricsCache, Metrics } from '../metrics/metrics';
import { ComponentMetricMinified } from '../metrics/interfaces';

declare global {
  interface Window {
    AWSC?: any;
    panorama?: any;
  }
}

function mockConsoleError() {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {
      // setting to noop to prevent printing expected errors into console
    });
  });

  afterEach(() => {
    expect(console.error).not.toHaveBeenCalled();
  });
}

describe('Client Metrics support', () => {
  const metrics = new Metrics({ packageSource: 'dummy-package', packageVersion: '1.0', theme: 'default' });

  const checkMetric = (metricName: string, detailObject: ComponentMetricMinified) => {
    expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
      eventType: 'awsui',
      eventContext: metricName,
      eventDetail: JSON.stringify(detailObject),
      eventValue: '1',
      timestamp: expect.any(Number),
    });
    expect(window.panorama).toHaveBeenCalledTimes(1);
  };

  beforeEach(() => {
    window.AWSC = {
      Clog: {
        log: () => {},
      },
    };
    window.panorama = () => {};
    jest.spyOn(window, 'panorama');
    jest.spyOn(window.AWSC.Clog, 'log');
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearOneTimeMetricsCache();
  });

  describe('sendMetric', () => {
    test('does nothing of both AWSC and panorama APIs are not available', () => {
      delete window.panorama;
      delete window.AWSC;
      expect(() => metrics.sendOpsMetricValue('name', 0)).not.toThrow();
    });

    test('uses AWSC.Clog.log API as fallback when panorama is unavailable', () => {
      delete window.panorama;
      metrics.sendOpsMetricValue('name', 0);
      expect(window.AWSC.Clog.log).toHaveBeenCalledWith('name', 0, undefined);
    });

    describe('within an iframe', () => {
      mockConsoleError();
      const originalWindowParent = Object.getOwnPropertyDescriptor(window, 'parent')!;

      afterEach(() => {
        Object.defineProperty(window, 'parent', originalWindowParent);
        expect(window.parent.panorama).toBeUndefined();
      });

      const setupIframe = () => {
        Object.defineProperty(window, 'parent', { configurable: true, writable: true, value: { parent: {} } });
      };

      test('does nothing when window.panorama is not defined in the parent iframe', () => {
        delete window.panorama;
        setupIframe();
        expect(window.parent.panorama).toBeUndefined();

        metrics.sendOpsMetricValue('name', 0); // only proves no exception thrown
      });

      test('works if window.parent has panorama object', () => {
        setupIframe();
        delete window.panorama;
        window.parent.panorama = () => {};
        jest.spyOn(window.parent, 'panorama');
        expect(window.panorama).toBeUndefined();
        expect(window.parent.panorama).toBeDefined();

        metrics.sendOpsMetricValue('name', 0);
        expect(window.parent.panorama).toHaveBeenCalledWith('trackCustomEvent', {
          eventType: 'awsui',
          eventContext: 'name',
          eventValue: '0',
          timestamp: expect.any(Number),
        });
      });
    });

    describe('when window.panorama is defined', () => {
      mockConsoleError();

      test('delegates to window.panorama when defined', () => {
        metrics.sendOpsMetricValue('name', 0);
        expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
          eventType: 'awsui',
          eventContext: 'name',
          eventValue: '0',
          timestamp: expect.any(Number),
        });
      });

      describe('Metric name validation', () => {
        const tryValidMetric = (metricName: string) => {
          test(`calls window.panorama when valid metric name used (${metricName})`, () => {
            metrics.sendOpsMetricValue(metricName, 1);
            expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
              eventType: 'awsui',
              eventContext: metricName,
              eventValue: '1',
              timestamp: expect.any(Number),
            });
          });
        };

        const tryInvalidMetric = (metricName: string) => {
          test(`logs an error when invalid metric name used (${metricName})`, () => {
            metrics.sendOpsMetricValue(metricName, 0);
            expect(console.error).toHaveBeenCalledWith(`Invalid metric name: ${metricName}`);
            jest.mocked(console.error).mockReset();
            expect(window.panorama).not.toHaveBeenCalled();
            expect(window.AWSC.Clog.log).not.toHaveBeenCalled();
          });
        };

        test('logs and error when metric name is too long', () => {
          // 1001 char: too long
          const longName = '1234567890'.repeat(100) + 'x';
          metrics.sendOpsMetricValue(longName, 0);
          expect(console.error).toHaveBeenCalledWith(`Metric name ${longName} is too long`);
          jest.mocked(console.error).mockReset();
        });

        tryValidMetric('1'); // min length 1 char
        tryValidMetric('123456789'); // digits are ok
        tryValidMetric('lowerUPPER'); // lower and uppercase chars ok
        tryValidMetric('dash-dash-dash'); // dashes ok
        tryValidMetric('1234567890'.repeat(100)); // 1000 chars: max length

        tryInvalidMetric(''); // too short, empty string not allowed
        tryInvalidMetric('colons:not:allowed'); // invalid characters
        tryInvalidMetric('spaces not allowed'); // invalid characters
      });
    });
  });

  describe('sendMetricOnce', () => {
    test('logs a metric of the same value only once', () => {
      metrics.sendOpsMetricValue('my-event', 1);
      expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
        eventType: 'awsui',
        eventContext: 'my-event',
        eventValue: '1',
        timestamp: expect.any(Number),
      });
      expect(window.panorama).toHaveBeenCalledTimes(1);

      metrics.sendOpsMetricValue('my-event', 1);
      expect(window.panorama).toHaveBeenCalledTimes(1);
    });

    test('does not deduplicate different values', () => {
      metrics.sendOpsMetricValue('my-event', 1);
      expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
        eventType: 'awsui',
        eventContext: 'my-event',
        eventValue: '1',
        timestamp: expect.any(Number),
      });
      expect(window.panorama).toHaveBeenCalledTimes(1);

      metrics.sendOpsMetricValue('my-event', 2);
      expect(window.panorama).toHaveBeenCalledTimes(2);
    });

    test('does not deduplicate metrics in different casing', () => {
      metrics.sendOpsMetricValue('my-event', 1);
      metrics.sendOpsMetricValue('My-Event', 1);
      expect(window.panorama).toHaveBeenCalledTimes(2);
      expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
        eventType: 'awsui',
        eventContext: 'my-event',
        eventValue: '1',
        timestamp: expect.any(Number),
      });
      expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
        eventType: 'awsui',
        eventContext: 'My-Event',
        eventValue: '1',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('sendOpsMetricObject', () => {
    test('sends metrics to panorama', () => {
      metrics.sendOpsMetricObject('awsui-ops-demo', {});
      expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
        eventType: 'awsui',
        eventContext: 'awsui-ops-demo',
        eventDetail: '{"o":"main","t":"default","f":"react","v":"1.0"}',
        eventValue: '1',
        timestamp: expect.any(Number),
      });
    });

    test('supports string, number and boolean details', () => {
      metrics.sendOpsMetricObject('awsui-ops-demo', { count: 1, value: 'a', enabled: true });
      expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
        eventType: 'awsui',
        eventContext: 'awsui-ops-demo',
        eventDetail: '{"o":"main","t":"default","f":"react","v":"1.0","count":1,"value":"a","enabled":true}',
        eventValue: '1',
        timestamp: expect.any(Number),
      });
    });

    test('deduplicates metrics with same details', () => {
      metrics.sendOpsMetricObject('awsui-ops-demo', { foo: 'something' });
      metrics.sendOpsMetricObject('awsui-ops-demo', { foo: 'something' });
      expect(window.panorama).toHaveBeenCalledTimes(1);
    });

    test('allows to send multiple metrics of same name but different details', () => {
      metrics.sendOpsMetricObject('awsui-ops-demo', { foo: 'something' });
      metrics.sendOpsMetricObject('awsui-ops-demo', { foo: 'something-else' });
      expect(window.panorama).toHaveBeenCalledTimes(2);
    });

    describe('correctly maps input object to metric name', () => {
      test('applies default values for origin, theme, version, framework', () => {
        metrics.sendOpsMetricObject('awsui-ops-demo', {});
        checkMetric('awsui-ops-demo', {
          o: 'main',
          t: 'default',
          f: 'react',
          v: '1.0',
        });
      });

      const versionTestCases = [
        ['', ['', '']],
        ['5', ['', '5']],
        ['5.100000000', ['5100000000', '5.100000000']],
        ['5.7.0', ['57', '5.7.0']],
        ['5.7 dkjhkhsgdjh', ['57', '5.7dkjhkhsgdjh']],
        ['5.7.0 kjfhgjhdshjsjd', ['57', '5.7.0kjfhgjhdshjsjd']],
      ] as const;

      versionTestCases.forEach(testCase => {
        test(`correctly interprets version ${testCase[0]}`, () => {
          const metrics = new Metrics('pkg', testCase[0]);
          metrics.logComponentUsed('DummyComponentName', { props: {} });
          checkMetric(`awsui_DummyComponentName_u${testCase[1][0]}`, {
            o: 'main',
            t: 'unknown',
            f: 'react',
            v: testCase[1][1],
            a: 'used',
            s: 'DummyComponentName',
            p: 'pkg',
            c: { props: {} },
          });
        });
      });
    });
  });

  describe('logComponentUsed', () => {
    test('logs the usage of the given component', () => {
      metrics.logComponentUsed('DummyComponentName', { props: {} });
      checkMetric(`awsui_DummyComponentName_d10`, {
        o: 'main',
        t: 'default',
        f: 'react',
        v: '1.0',
        a: 'used',
        s: 'DummyComponentName',
        p: 'dummy-package',
        c: { props: {} },
      });
    });

    test('logs the usage of the given component with additional props', () => {
      metrics.logComponentUsed('DummyComponentName', { props: { variant: 'primary' }, metadata: { isMobile: true } });
      checkMetric(`awsui_DummyComponentName_d10`, {
        o: 'main',
        t: 'default',
        f: 'react',
        v: '1.0',
        a: 'used',
        s: 'DummyComponentName',
        p: 'dummy-package',
        c: { props: { variant: 'primary' }, metadata: { isMobile: true } },
      });
    });

    test('logs null prop values but not undefined', () => {
      metrics.logComponentUsed('DummyComponentName', {
        props: {},
        metadata: { notDefined: undefined, nullValue: null },
      });
      checkMetric(`awsui_DummyComponentName_d10`, {
        o: 'main',
        t: 'default',
        f: 'react',
        v: '1.0',
        a: 'used',
        s: 'DummyComponentName',
        p: 'dummy-package',
        c: { props: {}, metadata: { nullValue: null } },
      });
    });

    test('reports numbers and non-finite numbers', () => {
      metrics.logComponentUsed('DummyComponentName', {
        props: { count: 123, notANumber: NaN, maxSize: Number.POSITIVE_INFINITY },
      });
      checkMetric(`awsui_DummyComponentName_d10`, {
        o: 'main',
        t: 'default',
        f: 'react',
        v: '1.0',
        a: 'used',
        s: 'DummyComponentName',
        p: 'dummy-package',
        c: { props: { count: 123, notANumber: 'NaN', maxSize: 'Infinity' } },
      });
    });
  });

  describe('logComponentsLoaded', () => {
    test('logs the components package loaded metric', () => {
      metrics.logComponentsLoaded();
      checkMetric(`awsui_dummy-package_d10`, {
        o: 'main',
        t: 'default',
        f: 'react',
        v: '1.0',
        a: 'loaded',
        s: 'dummy-package',
        c: undefined,
      });
    });
  });

  describe('sendPanoramaMetric', () => {
    test('does nothing when panorama is undefined', () => {
      delete window.panorama;
      metrics.sendPanoramaMetric({}); // only proves no exception thrown
    });

    describe('when panorama is defined', () => {
      const metric = {
        eventContext: 'context',
        eventDetail: 'detail',
        eventType: 'type',
        eventValue: 'value',
      };

      mockConsoleError();

      test('delegates to window.panorama when defined', () => {
        const mockDateNow = new Date('2022-12-16T00:00:00.00Z').valueOf();
        jest.spyOn(global.Date, 'now').mockImplementationOnce(() => mockDateNow);

        metrics.sendPanoramaMetric(metric);
        expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', { ...metric, timestamp: mockDateNow });
      });

      describe('Metric detail validation', () => {
        test('accepts event detail up to 200 characters', () => {
          const inputMetric = {
            ...metric,
            eventDetail: new Array(201).join('a'),
          };

          metrics.sendPanoramaMetric(inputMetric);
          expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', expect.objectContaining(inputMetric));
        });

        test('throws an error when detail is too long', () => {
          const invalidMetric = {
            ...metric,
            eventDetail: 'a'.repeat(4001),
          };

          metrics.sendPanoramaMetric(invalidMetric);
          expect(console.error).toHaveBeenCalledWith(
            `Event detail for metric is too long: ${invalidMetric.eventDetail}`
          );
          jest.mocked(console.error).mockReset();
        });

        test('accepts event detail as an object', () => {
          const inputMetric = {
            ...metric,
            eventDetail: {
              name: 'Hello',
            },
          };

          const expectedMetric = {
            ...metric,
            eventDetail: JSON.stringify(inputMetric.eventDetail),
          };

          metrics.sendPanoramaMetric(inputMetric);
          expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', expect.objectContaining(expectedMetric));
        });

        test('accepts event value as an object', () => {
          const inputMetric = {
            ...metric,
            eventValue: {
              name: 'Hello',
            },
          };

          const expectedMetric = {
            ...metric,
            eventValue: JSON.stringify(inputMetric.eventValue),
          };

          metrics.sendPanoramaMetric(inputMetric);
          expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', expect.objectContaining(expectedMetric));
        });
      });
    });
  });
});
