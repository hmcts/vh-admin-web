import { Injector, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrls } from '../shared/page-url.constants';
import { ErrorService } from './error.service';
import { LoggerService } from './logger.service';

describe('Error service', () => {
    let errorService: ErrorService;
    let ngZoneSpy: jasmine.SpyObj<NgZone>;
    let routerSpy: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;
    let injector: Injector;
    let redirectToSpy: jasmine.Spy;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        ngZoneSpy = jasmine.createSpyObj<NgZone>('NgZone', ['run']);
        loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);
        ngZoneSpy.run.and.callThrough();

        injector = Injector.create({ providers: [] });
        spyOn(injector, 'get').and.callFake(token => {
            if (token === Router) {
                return routerSpy;
            } else {
                return loggerSpy;
            }
        });

        errorService = new ErrorService(injector, ngZoneSpy);
        redirectToSpy = spyOn(errorService, 'redirectTo');
    });

    it('navigates to unauthorised page when 401 status code is returned', () => {
        errorService.handleError({ status: 401 });
        expect(redirectToSpy).toHaveBeenCalledWith(routerSpy, PageUrls.Unauthorised);
    });

    it('navigates to error page when status code is not 401 or 403', () => {
        errorService.handleError({ status: 500 });
        expect(redirectToSpy).toHaveBeenCalledWith(routerSpy, PageUrls.ServiceProblem);
    });

    it('navigates to unauthorised page when 403 status code is returned', () => {
        errorService.handleError({ status: 403 });
        expect(redirectToSpy).toHaveBeenCalledWith(routerSpy, PageUrls.Unauthorised);
    });
});
