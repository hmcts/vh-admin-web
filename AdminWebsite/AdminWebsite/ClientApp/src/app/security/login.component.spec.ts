import { waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { ConfigService } from '../services/config.service';
import { LoggerService } from '../services/logger.service';
import { WindowRef } from '../shared/window-ref';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let router: jasmine.SpyObj<Router>;
    let oidcService: MockOidcSecurityService;
    let returnUrl: jasmine.SpyObj<ReturnUrlService>;
    let logger: jasmine.SpyObj<LoggerService>;
    let window: jasmine.SpyObj<WindowRef>;
    let configService: jasmine.SpyObj<ConfigService>;
    let route: any;

    beforeEach(
        waitForAsync(() => {
            route = {
                snapshot: {
                    queryParams: {}
                }
            };

            logger = jasmine.createSpyObj<LoggerService>(['error', 'debug']);
            oidcService = new MockOidcSecurityService();
            router = jasmine.createSpyObj<Router>(['navigate', 'navigateByUrl']);
            returnUrl = jasmine.createSpyObj<ReturnUrlService>(['popUrl', 'setUrl']);
            window = jasmine.createSpyObj<WindowRef>(['getLocation']);
            configService = jasmine.createSpyObj<ConfigService>(['getClientSettingsObservable']);

            component = new LoginComponent(oidcService as any, route, router, logger, returnUrl, window, configService);
        })
    );

    const givenAuthenticated = (authenticated: boolean) => {
        oidcService.setAuthenticated(authenticated);
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
        route.snapshot.queryParams['returnUrl'] = 'returnto';

        await whenInitializingComponent();

        expect(returnUrl.setUrl).toHaveBeenCalledWith('returnto');
    });

    it('should not set url when current pathname is same as return url when not authenticated', async () => {
        givenAuthenticated(false);

        // and we have a return url set in the query param
        route.snapshot.queryParams['returnUrl'] = '/login?returnUrl=%2Flogin';

        await whenInitializingComponent();

        expect(returnUrl.setUrl).not.toHaveBeenCalled();
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
