import { CustomAdalInterceptor } from './custom-adal-interceptor';
import { AdalInterceptor } from 'adal-angular4';
import { HttpRequest, HttpHandler } from '@angular/common/http';

describe('CustomAdalInterceptor', () => {
    let adalInterceptor: jasmine.SpyObj<AdalInterceptor>;
    let service: CustomAdalInterceptor;
    let modifiedRequest: HttpRequest<any> = null;

    beforeEach(() => {
        adalInterceptor = jasmine.createSpyObj('AdalInterceptor', ['intercept']);
        service = new CustomAdalInterceptor(adalInterceptor);

        adalInterceptor.intercept.and.callFake((customRequest: HttpRequest<any>, _: any) => {
            modifiedRequest = customRequest;
        });
    });

    it('should add cache headers to get requests', () => {
        const next: any = {};
        const request = new HttpRequest<any>('GET', 'url');
        service.intercept(request, next);

        expect(modifiedRequest).not.toBeNull();
        expect(modifiedRequest.headers.get('Cache-Control')).toEqual('no-cache');
        expect(modifiedRequest.headers.get('Pragma')).toEqual('no-cache');
    });

    it('should pass calls directly to adal interceptor for non GET requests', () => {
        const next: any = {};
        const request = new HttpRequest<any>('DELETE', 'url');
        service.intercept(request, next);

        expect(modifiedRequest).not.toBeNull();
        expect(adalInterceptor.intercept).toHaveBeenCalled();
    });
});
