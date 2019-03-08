import {Injectable} from '@angular/core';
import {Logger} from './logger';
import {AppInsightsLogger} from './app-insights-logger.service';
import {ConsoleLogger} from './console-logger';

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
