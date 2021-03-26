import { waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { ConfigService } from '../services/config.service';
import { LoggerService } from '../services/logger.service';
import { WindowRef } from '../shared/window-ref';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let router: jasmine.SpyObj<Router>;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    let returnUrl: jasmine.SpyObj<ReturnUrlService>;
    let logger: jasmine.SpyObj<LoggerService>;
    let window: jasmine.SpyObj<WindowRef>;
    let configService: jasmine.SpyObj<ConfigService>;
    let route: any;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        configService = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
    });

    beforeEach(
        waitForAsync(() => {
            route = {
                snapshot: {
                    queryParams: {}
                }
            };

            logger = jasmine.createSpyObj<LoggerService>(['error', 'debug']);
            router = jasmine.createSpyObj<Router>(['navigate', 'navigateByUrl']);
            returnUrl = jasmine.createSpyObj<ReturnUrlService>(['popUrl', 'setUrl']);
            window = jasmine.createSpyObj<WindowRef>(['getLocation']);
            configService = jasmine.createSpyObj<ConfigService>(['getClientSettings']);

            component = new LoginComponent(oidcSecurityService, router, logger, returnUrl, configService);
            configService.getClientSettings.and.returnValue(of(null));
        })
    );

    const givenAuthenticated = (authenticated: boolean) => {
        oidcSecurityService.setAuthenticated(authenticated);
    };

    const whenInitializingComponent = async (): Promise<void> => {
        window.getLocation.and.returnValue({ pathname: '/login' });
        await component.ngOnInit();
    };

    it('should store root url if no return url is set', async () => {
        givenAuthenticated(false);
        await whenInitializingComponent();
        expect(returnUrl.setUrl).toHaveBeenCalledWith('/');
    });

    it('should remember return url if given when not authenticated', async () => {
        givenAuthenticated(false);

        // and we have a return url set in the query param
        returnUrl.popUrl.and.returnValue('returnto');
        await whenInitializingComponent();

        expect(returnUrl.setUrl).toHaveBeenCalledWith('returnto');
    });

    it('should redirect to remembered return url if authenticated', async () => {
        givenAuthenticated(true);
        returnUrl.popUrl.and.returnValue('testurl');

        await whenInitializingComponent();

        expect(router.navigateByUrl).toHaveBeenCalledWith('testurl');
    });

    it('should redirect to root url when authenticated if no return  url has been set', async () => {
        givenAuthenticated(true);

        await whenInitializingComponent();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should redirect to root if the remembered return url is invalid', async () => {
        givenAuthenticated(true);

        // and navigating to the return url throws an error
        router.navigateByUrl.and.throwError('invalid url');

        await whenInitializingComponent();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
});
