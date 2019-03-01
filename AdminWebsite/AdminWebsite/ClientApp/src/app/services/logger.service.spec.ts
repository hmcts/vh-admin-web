import { TestBed, async, inject } from '@angular/core/testing';

import { LoggerService } from './logger.service';
import { Config } from '../common/model/config';
import { AppInsightsLogger } from './app-insights-logger.service';

describe('LoggerService', () => {

  let logger: LoggerService;
  let appInsightsLogger: jasmine.SpyObj<AppInsightsLogger>;

  beforeEach(() => {
    appInsightsLogger = jasmine.createSpyObj('AppInsightsLogger', ['trackException', 'trackEvent']);

    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        { provide: AppInsightsLogger, useValue: appInsightsLogger }
      ]
    });

    logger = TestBed.get(LoggerService);
  });

  it('should be created', inject([LoggerService], (service: LoggerService) => {
    expect(service).toBeTruthy();
  }));

  it('waits until initialized before logging', () => {
    logger.event('testing');
  });
});
