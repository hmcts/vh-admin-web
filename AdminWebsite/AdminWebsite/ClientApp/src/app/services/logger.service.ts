import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { AppInsightsLogger } from './app-insights-logger.service';

@Injectable()
export class LoggerService {

  private loggers: Logger[];

  constructor(appInsightsLogger: AppInsightsLogger
  ) {
    this.loggers = [new ConsoleLogger(), appInsightsLogger];
  }

  error(message: string, err: Error, properties?: any) {
    this.loggers.forEach(logger => logger.trackException(message, err, properties));
  }

  event(event: string, properties?: any) {
    this.loggers.forEach(logger => logger.trackEvent(event, properties));
  }
}

class ConsoleLogger implements Logger {
  trackEvent(eventName: string, properties: any = null) {
    const propertiesFormatted = properties ? JSON.stringify(properties) : '';
    console.log(`[EVENT:${eventName}] ${propertiesFormatted}`.trim());
  }

  trackException(message: string, err: Error, properties: any = null) {
    console.error(`[ERROR] ${message}`, err);
    if (properties) {
      console.log(`Properties: ${JSON.stringify(properties)}`);
    }
  }
}
