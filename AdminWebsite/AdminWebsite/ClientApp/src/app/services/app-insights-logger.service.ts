import { AppInsights } from 'applicationinsights-js';
import { Logger } from './logger';
import { Config } from '../common/model/config';
import { Injectable } from '@angular/core';

@Injectable()
export class AppInsightsLogger implements Logger {
  errorInfo: any;
  constructor(config: Config) {
    let appInsightsConfig: Microsoft.ApplicationInsights.IConfig = {
      instrumentationKey: config.appInsightsInstrumentationKey,
    };

    // Unfortunately, there is no way to know if the setup is successful or not
    AppInsights.downloadAndSetup(appInsightsConfig);
  }

  trackPage(pageName: string, url: string) {
    AppInsights.trackPageView(pageName, url);
  }

  trackEvent(eventName: string, properties: any) {
    AppInsights.trackEvent(eventName, properties);
  }

  trackException(message: string, err: Error, properties: any) {
    properties = properties || {};
    properties.message = message;

    this.errorInfo = err;
    properties.errorInformation =
      this.errorInfo ? `${this.errorInfo.error} : ${this.errorInfo.status}
       : ${this.errorInfo.statusText} : ${this.errorInfo.url} : ${this.errorInfo.message}` : ``;

    AppInsights.trackException(err, null, properties);
  }
}
