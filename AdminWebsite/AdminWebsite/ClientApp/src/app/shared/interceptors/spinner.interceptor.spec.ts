import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { SpinnerInterceptor } from './spinner.interceptor';
import { LoadingSpinnerService } from 'src/app/services/loading-spinner.service';
import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { of } from 'rxjs';

describe('SpinnerInterceptor', () => {
    let loadingSpinnerServiceSpy: jasmine.SpyObj<LoadingSpinnerService>;

    beforeEach(() => {
        loadingSpinnerServiceSpy = jasmine.createSpyObj<LoadingSpinnerService>('LoadingSpinnerService', ['requestStarted', 'requestEnded']);

        TestBed.configureTestingModule({
            providers: [SpinnerInterceptor, { provide: LoadingSpinnerService, useValue: loadingSpinnerServiceSpy }]
        });
    });

    it('should not start spinner for post hearing request', fakeAsync(() => {
        // Arrange
        const interceptor: SpinnerInterceptor = TestBed.inject(SpinnerInterceptor);

        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });

        const request = jasmine.createSpyObj('HttpRequest', ['method', 'url']);
        request.method = 'Post';
        request.url = 'api/hearing';

        // Act
        interceptor.intercept(request, next).subscribe();
        tick();

        // Assert
        expect(loadingSpinnerServiceSpy.requestStarted).toHaveBeenCalledTimes(0);
    }));

    it('should not start spinner for api call on ignored list', fakeAsync(() => {
        // Arrange
        const interceptor: SpinnerInterceptor = TestBed.inject(SpinnerInterceptor);

        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });

        const request = jasmine.createSpyObj('HttpRequest', ['method', 'url']);
        request.method = 'Get';
        request.url = 'api/feature-flag';

        // Act
        interceptor.intercept(request, next).subscribe();
        tick();

        // Assert
        expect(loadingSpinnerServiceSpy.requestStarted).toHaveBeenCalledTimes(0);
    }));

    it('should start and stop for api call not on the on ignored list', fakeAsync(() => {
        // Arrange
        const interceptor: SpinnerInterceptor = TestBed.inject(SpinnerInterceptor);

        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });

        const request = jasmine.createSpyObj('HttpRequest', ['method', 'url']);
        request.method = 'Get';
        request.url = '/api/reference/types';

        // Act
        interceptor.intercept(request, next).subscribe();
        tick();

        // Assert
        expect(loadingSpinnerServiceSpy.requestStarted).toHaveBeenCalledTimes(1);

        expect(loadingSpinnerServiceSpy.requestEnded).toHaveBeenCalledTimes(1);
    }));
});
