import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { RefreshTokenParameterInterceptor } from './refresh-token-parameter.interceptor';
import { MockSecurityService } from '../../testing/mocks/MockOidcSecurityService';

describe('RefreshTokenParameterInterceptor', () => {
    let sut: RefreshTokenParameterInterceptor;
    const mockService = new MockSecurityService();
    beforeEach(() => {
        sut = new RefreshTokenParameterInterceptor(mockService as any);
    });

    it('should call next with updated body if token request post', async () => {
        // Arrange
        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });
        const request = new HttpRequest<any>('POST', '/oauth2/v2.0/token', 'params1');

        // Act
        await lastValueFrom(sut.intercept(request, next));

        // Assert
        expect(result.body).toBe(`${request.body}&scope=openid%20profile%20offline_access`);
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('should call next and not update body if - not post', async () => {
        // Arrange
        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });
        const request = new HttpRequest<any>('GET', '/oauth2/v2.0/token');

        // Act
        await lastValueFrom(sut.intercept(request, next));

        // Assert
        expect(result.body).toBe(request.body);
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('should call next and not update body if - post not matching route', async () => {
        // Arrange
        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });
        const request = new HttpRequest<any>('POST', '/', 'params1');

        // Act
        await lastValueFrom(sut.intercept(request, next));

        // Assert
        expect(result.body).toBe(request.body);
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('should call next and not update body if - no scope in config', async () => {
        // Arrange
        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });
        const request = new HttpRequest<any>('POST', '/oauth2/v2.0/token', 'params1');
        mockService.configuration.scope = null;

        // Act
        await lastValueFrom(sut.intercept(request, next));

        // Assert
        expect(result.body).toBe(request.body);
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('should call next and not update body if - no body', async () => {
        // Arrange
        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });
        const request = new HttpRequest<any>('POST', '/oauth2/v2.0/token', null);

        // Act
        await lastValueFrom(sut.intercept(request, next));

        // Assert
        expect(result.body).toBe(request.body);
        expect(next.handle).toHaveBeenCalledTimes(1);
    });
});
