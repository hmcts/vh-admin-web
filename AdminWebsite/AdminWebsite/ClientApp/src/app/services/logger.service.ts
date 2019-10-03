//import {Injectable} from '@angular/core';
//import {Logger} from './logger';
//import {AppInsightsLogger} from './app-insights-logger.service';
//import {ConsoleLogger} from './console-logger';

//@Injectable()
//export class LoggerService {

//  private loggers: Logger[];

//  constructor(appInsightsLogger: AppInsightsLogger
//  ) {
//    this.loggers = [new ConsoleLogger(), appInsightsLogger];
//  }

//  error(message: string, err: Error, properties?: any) {
//    this.loggers.forEach(logger => logger.trackException(message, err, properties));
//  }

//  event(event: string, properties?: any) {
//    this.loggers.forEach(logger => logger.trackEvent(event, properties));
//  }
//}
import { Injectable, InjectionToken, Inject } from '@angular/core';
import { LogAdapter } from './log-adapter';
import { Logger } from './logger';

export const LOG_ADAPTER = new InjectionToken<LogAdapter>('LogAdapter');

@Injectable()
export class LoggerService implements Logger {

  constructor(@Inject(LOG_ADAPTER) private adapters: LogAdapter[]) {
  }

  debug(message: string): void {
    this.adapters.forEach(logger => logger.debug(message));
  }

  info(message: string): void {
    this.adapters.forEach(logger => logger.info(message));
  }

  warn(message: string): void {
    this.adapters.forEach(logger => logger.warn(message));
  }

  event(event: string, properties?: any) {
    this.adapters.forEach(logger => logger.trackEvent(event, properties));
  }

  error(message: string, err: Error, properties?: any) {
    this.adapters.forEach(logger => logger.trackException(message, err, properties));
  }
}
