//import { AppInsights } from 'applicationinsights-js';
//import { Logger } from './logger';
//import { Config } from '../common/model/config';
//import { Injectable } from '@angular/core';

//@Injectable()
//export class AppInsightsLogger implements Logger {
//  errorInfo: any;
//  constructor(config: Config) {
//    const appInsightsConfig: Microsoft.ApplicationInsights.IConfig = {
//      instrumentationKey: config.appInsightsInstrumentationKey,
//    };

//    // Unfortunately, there is no way to know if the setup is successful or not
//    AppInsights.downloadAndSetup(appInsightsConfig);

//    // When it's been initialised, set the role so we know which application is logging
//    AppInsights.queue.push(() => {
//      AppInsights.context.addTelemetryInitializer((envelope) => {
//        envelope.tags['ai.cloud.role'] = 'vh-admin-web';
//      });
//    });
//  }

//  trackPage(pageName: string, url: string) {
//    AppInsights.trackPageView(pageName, url);
//  }

//  trackEvent(eventName: string, properties: any) {
//    AppInsights.trackEvent(eventName, properties);
//  }

//  trackException(message: string, err: Error, properties: any) {
//    properties = properties || {};
//    properties.message = message;

//    this.errorInfo = err;
//    properties.errorInformation =
//      this.errorInfo ? `${this.errorInfo.error} : ${this.errorInfo.status}
//       : ${this.errorInfo.statusText} : ${this.errorInfo.url} : ${this.errorInfo.message}` : ``;

//    AppInsights.trackException(err, null, properties);
//  }
//}
import { AppInsights } from 'applicationinsights-js';
import { LogAdapter } from './log-adapter';
import { Config } from '../common/model/config';
import { Injectable } from '@angular/core';

enum SeverityLevel {
  Verbose = 0,
  Information = 1,
  Warning = 2,
  Error = 3,
  Critical = 4
}

@Injectable()
export class AppInsightsLogger implements LogAdapter {
  errorInfo: any;

  constructor(config: Config) {
    const appInsightsConfig: Microsoft.ApplicationInsights.IConfig = {
      instrumentationKey: config.appInsightsInstrumentationKey,
    };

    // Unfortunately, there is no way to know if the setup is successful or not
    AppInsights.downloadAndSetup(appInsightsConfig);

    // When it's been initialised, set the role so we know which application is logging
    AppInsights.queue.push(() => {
      AppInsights.context.addTelemetryInitializer((envelope) => {
        envelope.tags['ai.cloud.role'] = 'vh-admin-web';
      });
    });
  }

  debug(message: string): void {
    AppInsights.trackTrace(message, null, SeverityLevel.Verbose);
  }

  info(message: string): void {
    AppInsights.trackTrace(message, null, SeverityLevel.Information);
  }

  warn(message: string): void {
    AppInsights.trackTrace(message, null, SeverityLevel.Warning);
  }

  trackPage(pageName: string, url: string) {
    AppInsights.trackPageView(pageName, url);
  }

  trackEvent(eventName: string, properties: any) {
    AppInsights.trackEvent(eventName, properties);
  }

  trackException(message: string, err: Error, properties: any) {
    console.log('APP INS TRACK XXXXXX');
    properties = properties || {};
    properties.message = message;

    this.errorInfo = err;
    properties.errorInformation =
      this.errorInfo ? `${this.errorInfo.error} : ${this.errorInfo.status}
       : ${this.errorInfo.statusText} : ${this.errorInfo.url} : ${this.errorInfo.message}` : ``;

    AppInsights.trackException(err, null, properties);
  }
}

