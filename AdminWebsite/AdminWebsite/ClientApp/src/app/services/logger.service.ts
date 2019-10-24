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
