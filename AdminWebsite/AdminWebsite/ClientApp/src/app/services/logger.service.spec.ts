import { LogAdapter } from './log-adapter';
import { TestBed } from '@angular/core/testing';
import { LoggerService, LOG_ADAPTER } from './logger.service';
import { Logger } from './logger';

describe('LoggerService', () => {
  let logger: Logger;
  let logAdapter: jasmine.SpyObj<LogAdapter>;

  beforeEach(() => {
    logAdapter = jasmine.createSpyObj<LogAdapter>(['debug', 'info', 'warn', 'trackException', 'trackEvent']);

    // Set up the entire testing module as to test the injection token works properly
    TestBed.configureTestingModule({
      providers: [
        { provide: Logger, useClass: LoggerService },
        { provide: LOG_ADAPTER, useValue: logAdapter, multi: true }
      ]
    });

    logger = TestBed.inject(Logger);
  });

  it('logs debug to all adapters', () => {
    logger.debug('debug');

    expect(logAdapter.debug).toHaveBeenCalledWith('debug');
  });

  it('logs info to all adapters', () => {
    logger.info('info');

    expect(logAdapter.info).toHaveBeenCalledWith('info');
  });

  it('logs warns to all adapters', () => {
    logger.warn('warn');

    expect(logAdapter.warn).toHaveBeenCalledWith('warn');
  });

  it('logs events to all adapters', () => {
    const properties = {};
    logger.event('event', properties);

    expect(logAdapter.trackEvent).toHaveBeenCalledWith('event', properties);
  });

  it('logs errors to all adapters', () => {
    const error = new Error();
    const properties = {};
    logger.error('error', error, properties);

    expect(logAdapter.trackException).toHaveBeenCalledWith('error', error, properties);
  });
});
