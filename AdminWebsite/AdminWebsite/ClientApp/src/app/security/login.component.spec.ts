import { async } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { AdalService } from 'adal-angular4';
import { Router } from '@angular/router';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { LoggerService } from '../services/logger.service';
import {WindowRef} from '../shared/window-ref';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let router: jasmine.SpyObj<Router>;
  let adalService: jasmine.SpyObj<AdalService>;
  let returnUrl: jasmine.SpyObj<ReturnUrlService>;
  let logger: jasmine.SpyObj<LoggerService>;
  let window: jasmine.SpyObj<WindowRef>;
  let route: any;

  beforeEach(async(() => {
    route = {
      snapshot: {
        queryParams: {}
      }
    };

    logger = jasmine.createSpyObj<LoggerService>(['error']);
    adalService = jasmine.createSpyObj<AdalService>(['setAuthenticated', 'login', 'userInfo']);
    router = jasmine.createSpyObj<Router>(['navigate', 'navigateByUrl']);
    returnUrl = jasmine.createSpyObj<ReturnUrlService>(['popUrl', 'setUrl']);
    window = jasmine.createSpyObj<WindowRef>(['getLocation']);

    component = new LoginComponent(adalService, route, router, logger, returnUrl, window);
  }));

  const givenAuthenticated = (authenticated: boolean) => {
    adalService.userInfo.authenticated = authenticated;
  };

  const whenInitializingComponent = async (): Promise<void> => {
    window.getLocation.and.returnValue({pathname: '/login'});
    await component.ngOnInit();
  };

  it('should store root url if no return url is set and call login if not authenticated', async () => {
    givenAuthenticated(false);

    await whenInitializingComponent();

    expect(adalService.login).toHaveBeenCalled();
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
