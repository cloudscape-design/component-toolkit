// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MetricsTestHelper, Metrics } from '../metrics/metrics';
import { MetricDetail } from '../metrics/interfaces';

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
  const metrics = new Metrics('dummy-package', '1.0');

  const checkMetric = (metricName: string, detailObject: MetricDetail) => {
    expect(window.AWSC.Clog.log).toHaveBeenCalledWith(metricName, 1, JSON.stringify(detailObject));
    expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(1);
  };

  beforeEach(() => {
    metrics.initMetrics('default');
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
    new MetricsTestHelper().resetOneTimeMetricsCache();
  });

  describe('sendMetric', () => {
    test('does nothing when window.AWSC is undefined', () => {
      delete window.AWSC;
      metrics.sendMetric('name', 0); // only proves no exception thrown
    });

    test('does nothing when window.AWSC.Clog is undefined', () => {
      window.AWSC = {};
      metrics.sendMetric('name', 0); // only proves no exception thrown
    });

    test('uses panorama API as fallback when AWSC.Clog.log is unavailable', () => {
      delete window.AWSC;
      metrics.sendMetric('name', 0);
      expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
        eventName: 'name',
        eventValue: '0',
        timestamp: expect.any(Number),
      });
    });

    test('does nothing when window.AWSC.Clog.log is undefined', () => {
      window.AWSC = {
        Clog: undefined,
      };
      metrics.sendMetric('name', 0); // only proves no exception thrown
    });

    describe('within an iframe', () => {
      mockConsoleError();
      const originalWindowParent = Object.getOwnPropertyDescriptor(window, 'parent')!;

      afterEach(() => {
        Object.defineProperty(window, 'parent', originalWindowParent);
        expect(window.parent.AWSC).toBeUndefined();
      });

      const setupIframe = () => {
        Object.defineProperty(window, 'parent', { configurable: true, writable: true, value: { parent: {} } });
      };

      test('does nothing when AWSC is not defined in the parent iframe', () => {
        delete window.AWSC;
        setupIframe();
        expect(window.parent.AWSC).toBeUndefined();

        metrics.sendMetric('name', 0); // only proves no exception thrown
      });

      test('works if parent has AWSC', () => {
        setupIframe();
        delete window.AWSC;
        window.parent.AWSC = {
          Clog: {
            log: () => {},
          },
        };
        jest.spyOn(window.parent.AWSC.Clog, 'log');
        expect(window.AWSC).toBeUndefined();
        expect(window.parent.AWSC).toBeDefined();

        metrics.sendMetric('name', 0, undefined);
        expect(window.parent.AWSC.Clog.log).toHaveBeenCalledWith('name', 0, undefined);
      });
    });

    describe('when window.AWSC.Clog.log is defined', () => {
      mockConsoleError();

      test('delegates to window.AWSC.Clog.log when defined', () => {
        metrics.sendMetric('name', 0, undefined);
        expect(window.AWSC.Clog.log).toHaveBeenCalledWith('name', 0, undefined);
      });

      describe('Metric name validation', () => {
        const tryValidMetric = (metricName: string) => {
          test(`calls AWSC.Clog.log when valid metric name used (${metricName})`, () => {
            metrics.sendMetric(metricName, 1, 'detail');
            expect(window.AWSC.Clog.log).toHaveBeenCalledWith(metricName, 1, 'detail');
          });
        };

        const tryInvalidMetric = (metricName: string) => {
          test(`logs an error when invalid metric name used (${metricName})`, () => {
            metrics.sendMetric(metricName, 0, 'detail');
            expect(console.error).toHaveBeenCalledWith(`Invalid metric name: ${metricName}`);
            jest.mocked(console.error).mockReset();
          });
        };

        test('logs and error when metric name is too long', () => {
          // 1001 char: too long
          const longName = '1234567890'.repeat(100) + 'x';
          metrics.sendMetric(longName, 0, 'detail');
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

      describe('Metric detail validation', () => {
        test('accepts details below the character limit', () => {
          const validDetail = 'a'.repeat(4000);
          metrics.sendMetric('metricName', 1, validDetail);
          expect(window.AWSC.Clog.log).toHaveBeenCalledWith('metricName', 1, validDetail);
        });

        test('throws an error when detail is too long', () => {
          const invalidDetail = 'a'.repeat(4001);
          metrics.sendMetric('metricName', 0, invalidDetail);
          expect(console.error).toHaveBeenCalledWith(`Detail for metric metricName is too long: ${invalidDetail}`);
          jest.mocked(console.error).mockReset();
        });
      });
    });
  });

  describe('sendMetricOnce', () => {
    test('logs a metric name only once', () => {
      metrics.sendMetricOnce('my-event', 1);
      expect(window.AWSC.Clog.log).toHaveBeenCalledWith('my-event', 1, undefined);
      expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(1);

      metrics.sendMetricOnce('my-event', 2);
      expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(1);

      metrics.sendMetricOnce('My-Event', 3);
      expect(window.AWSC.Clog.log).toHaveBeenCalledWith('My-Event', 3, undefined);
      expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendMetricObject', () => {
    test('uses panorama API as fallback when AWSC.Clog.log is unavailable', () => {
      window.AWSC = undefined;
      metrics.sendMetricObject({ source: 'pkg', action: 'used', version: '5.0' }, 1);
      expect(window.panorama).toHaveBeenCalledWith('trackCustomEvent', {
        eventDetail: '{"o":"main","s":"pkg","t":"default","a":"used","f":"react","v":"5.0"}',
        eventName: 'awsui_pkg_d50',
        eventValue: '1',
        timestamp: expect.any(Number),
      });
    });

    describe('correctly maps input object to metric name', () => {
      test('applies default values for theme (default) and framework (react)', () => {
        metrics.sendMetricObject(
          {
            source: 'pkg',
            action: 'used',
            version: '5.0',
          },
          1
        );
        checkMetric('awsui_pkg_d50', {
          o: 'main',
          s: 'pkg',
          t: 'default',
          a: 'used',
          f: 'react',
          v: '5.0',
          c: undefined,
        });
      });

      const versionTestCases = [
        ['', ['', '']],
        ['5', ['', '5']],
        ['5.100000000', ['5100000000', '5.100000000']],
        ['5.7.0', ['57', '5.7.0']],
        ['5.7 dkjhkhsgdjh', ['57', '5.7dkjhkhsgdjh']],
        ['5.7.0 kjfhgjhdshjsjd', ['57', '5.7.0kjfhgjhdshjsjd']],
      ];

      versionTestCases.forEach(testCase => {
        test(`correctly interprets version ${testCase[0]}`, () => {
          metrics.sendMetricObject(
            {
              source: 'pkg',
              action: 'used',
              version: testCase[0] as string,
            },
            1
          );
          checkMetric(`awsui_pkg_d${testCase[1][0]}`, {
            o: 'main',
            s: 'pkg',
            t: 'default',
            a: 'used',
            f: 'react',
            v: testCase[1][1],
            c: undefined,
          });
        });
      });
    });
  });

  describe('sendMetricObjectOnce', () => {
    test('logs a metric only once if it is the same object', () => {
      const metricObj = {
        source: 'pkg',
        action: 'used' as const,
        version: '5.0',
      };

      metrics.sendMetricObjectOnce(metricObj, 1);
      metrics.sendMetricObjectOnce(metricObj, 1);
      expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(1);
    });
    test('logs metric for each different version if same source and action', () => {
      metrics.sendMetricObjectOnce(
        {
          source: 'pkg1',
          action: 'used',
          version: '5.0',
        },
        1
      );
      metrics.sendMetricObjectOnce(
        {
          source: 'pkg1',
          action: 'used',
          version: '6.0',
        },
        1
      );
      expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(2);
    });
    test('logs a metric multiple times if same source but different actions', () => {
      metrics.sendMetricObjectOnce(
        {
          source: 'pkg2',
          action: 'used',
          version: '5.0',
        },
        1
      );
      metrics.sendMetricObjectOnce(
        {
          source: 'pkg2',
          action: 'loaded',
          version: '5.0',
        },
        1
      );
      expect(window.AWSC.Clog.log).toHaveBeenCalledTimes(2);
    });
  });

  describe('initMetrics', () => {
    test('sets theme', () => {
      const metrics = new Metrics('dummy-package', 'dummy-version');
      metrics.initMetrics('dummy-theme');

      // check that the theme is correctly set
      metrics.sendMetricObject(
        {
          source: 'pkg',
          action: 'used',
          version: '5.0',
        },
        1
      );
      checkMetric(`awsui_pkg_d50`, {
        o: 'main',
        s: 'pkg',
        t: 'dummy-theme',
        a: 'used',
        f: 'react',
        v: '5.0',
        c: undefined,
      });
    });
  });

  describe('logComponentUsed', () => {
    test('logs the usage of the given component', () => {
      metrics.logComponentUsed('DummyComponentName', { props: {} });
      checkMetric(`awsui_DummyComponentName_d10`, {
        o: 'main',
        s: 'DummyComponentName',
        t: 'default',
        a: 'used',
        f: 'react',
        v: '1.0',
        c: { props: {} },
      });
    });

    test('logs the usage of the given component with additional props', () => {
      metrics.logComponentUsed('DummyComponentName', { props: { variant: 'primary' }, metadata: { isMobile: true } });
      checkMetric(`awsui_DummyComponentName_d10`, {
        o: 'main',
        s: 'DummyComponentName',
        t: 'default',
        a: 'used',
        f: 'react',
        v: '1.0',
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
        s: 'DummyComponentName',
        t: 'default',
        a: 'used',
        f: 'react',
        v: '1.0',
        c: { props: {}, metadata: { nullValue: null } },
      });
    });

    test('reports numbers and non-finite numbers', () => {
      metrics.logComponentUsed('DummyComponentName', {
        props: { count: 123, notANumber: NaN, maxSize: Number.POSITIVE_INFINITY },
      });
      checkMetric(`awsui_DummyComponentName_d10`, {
        o: 'main',
        s: 'DummyComponentName',
        t: 'default',
        a: 'used',
        f: 'react',
        v: '1.0',
        c: { props: { count: 123, notANumber: 'NaN', maxSize: 'Infinity' } },
      });
    });
  });

  describe('logComponentsLoaded', () => {
    test('logs the components package loaded metric', () => {
      metrics.logComponentsLoaded();
      checkMetric(`awsui_dummy-package_d10`, {
        o: 'main',
        s: 'dummy-package',
        t: 'default',
        a: 'loaded',
        f: 'react',
        v: '1.0',
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
