// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

interface AWSC {
  Clog: any;
}

interface MetricsWindow extends Window {
  AWSC?: AWSC;
  panorama?: any;
}

export interface MetricsV2EventItem {
  eventContext?: string;
  eventDetail?: string | Record<string, string | number | boolean>;
  eventValue?: string | Record<string, string | number | boolean>;
  timestamp?: number;
}

interface PanoramaMetric {
  eventType: string;
  eventContext?: string;
  eventValue?: string;
  eventDetail?: string;
  timestamp: number;
}

type PanoramaFunction = (event: 'trackCustomEvent', data: PanoramaMetric) => void;

const AWSUI_EVENT = 'awsui';

function validateLength(value: string | undefined, maxLength: number): boolean {
  return !value || value.length <= maxLength;
}

/**
 * Console Platform's client logging JS API client.
 */
export class CLogClient {
  /**
   * Sends metric but only if Console Platform client logging JS API is present in the page.
   */
  sendMetric(metricName: string, value: number, detail?: string): void {
    if (!metricName || !/^[a-zA-Z0-9_-]+$/.test(metricName)) {
      console.error(`Invalid metric name: ${metricName}`);
      return;
    }
    if (!validateLength(metricName, 1000)) {
      console.error(`Metric name ${metricName} is too long`);
      return;
    }
    if (!validateLength(detail, 4000)) {
      console.error(`Detail for metric ${metricName} is too long: ${detail}`);
      return;
    }
    const wasSent = new PanoramaClient().sendMetric({
      eventContext: metricName,
      eventDetail: detail,
      eventValue: `${value}`,
      timestamp: Date.now(),
    });
    if (wasSent) {
      return;
    }
    const AWSC = this.findAWSC(window);
    if (typeof AWSC === 'object' && typeof AWSC.Clog === 'object' && typeof AWSC.Clog.log === 'function') {
      AWSC.Clog.log(metricName, value, detail);
    }
  }

  private findAWSC(currentWindow?: MetricsWindow): AWSC | undefined {
    try {
      if (typeof currentWindow?.AWSC === 'object') {
        return currentWindow?.AWSC;
      }

      if (!currentWindow || currentWindow.parent === currentWindow) {
        // When the window has no more parents, it references itself
        return undefined;
      }

      return this.findAWSC(currentWindow.parent);
    } catch (ex) {
      // Most likely a cross-origin access error
      return undefined;
    }
  }
}

/**
 * Console Platform's client v2 logging JS API client.
 */
export class PanoramaClient {
  /**
   * Sends metric but only if Console Platform client v2 logging JS API is present in the page.
   */
  sendMetric(metric: MetricsV2EventItem): boolean {
    const panorama = this.findPanorama(window);
    if (!panorama) {
      return false;
    }
    const payload: PanoramaMetric = {
      eventType: AWSUI_EVENT,
      timestamp: Date.now(),
      ...metric,
      eventDetail: typeof metric.eventDetail === 'object' ? JSON.stringify(metric.eventDetail) : metric.eventDetail,
      eventValue: typeof metric.eventValue === 'object' ? JSON.stringify(metric.eventValue) : metric.eventValue,
    };

    if (!validateLength(payload.eventDetail, 4000)) {
      this.onMetricError(`Event detail for metric is too long: ${payload.eventDetail}`);
      return true;
    }
    if (!validateLength(payload.eventValue, 4000)) {
      this.onMetricError(`Event value for metric is too long: ${payload.eventValue}`);
      return true;
    }
    if (!validateLength(payload.eventContext, 4000)) {
      this.onMetricError(`Event context for metric is too long: ${payload.eventContext}`);
      return true;
    }
    panorama('trackCustomEvent', payload);
    return true;
  }

  private onMetricError(message: string) {
    console.error(message);
    const panorama = this.findPanorama(window);
    if (panorama) {
      panorama('trackCustomEvent', {
        eventType: AWSUI_EVENT,
        eventContext: 'awsui-metric-error',
        eventDetail: message.slice(0, 4000),
        timestamp: Date.now(),
      });
    }
  }

  private findPanorama(currentWindow?: MetricsWindow): PanoramaFunction | undefined {
    try {
      if (typeof currentWindow?.panorama === 'function') {
        return currentWindow?.panorama;
      }

      if (!currentWindow || currentWindow.parent === currentWindow) {
        // When the window has no more parents, it references itself
        return undefined;
      }

      return this.findPanorama(currentWindow.parent);
    } catch (ex) {
      // Most likely a cross-origin access error
      return undefined;
    }
  }
}
