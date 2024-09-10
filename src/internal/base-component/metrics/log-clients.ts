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
  eventName?: string;
  eventType?: string;
  eventContext?: string;
  eventDetail?: string | Record<string, string | number | boolean>;
  eventValue?: string | Record<string, string | number | boolean>;
  timestamp?: number;
}

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
    const AWSC = this.findAWSC(window);
    if (typeof AWSC === 'object' && typeof AWSC.Clog === 'object' && typeof AWSC.Clog.log === 'function') {
      AWSC.Clog.log(metricName, value, detail);
    } else {
      new PanoramaClient().sendMetric({
        eventName: metricName,
        eventDetail: detail,
        eventValue: `${value}`,
        timestamp: Date.now(),
      });
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
  sendMetric(metric: MetricsV2EventItem): void {
    if (typeof metric.eventDetail === 'object') {
      metric.eventDetail = JSON.stringify(metric.eventDetail);
    }
    if (typeof metric.eventValue === 'object') {
      metric.eventValue = JSON.stringify(metric.eventValue);
    }
    if (!validateLength(metric.eventName, 1000)) {
      console.error(`Event name for metric is too long: ${metric.eventName}`);
      return;
    }
    if (!validateLength(metric.eventDetail, 4000)) {
      console.error(`Event detail for metric is too long: ${metric.eventDetail}`);
      return;
    }
    if (!validateLength(metric.eventValue, 4000)) {
      console.error(`Event value for metric is too long: ${metric.eventValue}`);
      return;
    }
    if (!validateLength(metric.eventContext, 4000)) {
      console.error(`Event context for metric is too long: ${metric.eventContext}`);
      return;
    }
    if (!validateLength(metric.eventType, 50)) {
      console.error(`Event type for metric is too long: ${metric.eventType}`);
      return;
    }
    const panorama = this.findPanorama(window);
    if (typeof panorama === 'function') {
      panorama('trackCustomEvent', { timestamp: Date.now(), ...metric });
    }
  }

  private findPanorama(currentWindow?: MetricsWindow): any | undefined {
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
