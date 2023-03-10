import { fakeAsync } from '@angular/core/testing';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Subject } from 'rxjs';
import { UserIdentityService } from '../services/user-identity.service';
import { LogoutComponent } from './logout.component';
import { MockAuthenticatedResult } from '../testing/mocks/MockOidcSecurityService';

describe('LogoutComponent', () => {
    let component: LogoutComponent;
    let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;
    let securityServiceSpy;

    beforeAll(() => {
        securityServiceSpy = jasmine.createSpyObj<OidcSecurityService>('OidcSecurityService', [
            'logoffAndRevokeTokens',
            'isAuthenticated$'
        ]);
        securityServiceSpy.logoffAndRevokeTokens.and.returnValue({ subscribe: () => {} });
        userIdentityServiceSpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['clearUserProfile']);
    });

    beforeEach(() => {
        securityServiceSpy.isAuthenticated$ = new Subject<MockAuthenticatedResult>();
        userIdentityServiceSpy.clearUserProfile.calls.reset();
        securityServiceSpy.logoffAndRevokeTokens.calls.reset();

        component = new LogoutComponent(securityServiceSpy, userIdentityServiceSpy);
    });

    it('should call logout if authenticated', fakeAsync(() => {
        component.ngOnInit();
        const isAuthenticated = true;
        const authenticatedResult = new MockAuthenticatedResult(isAuthenticated);
        securityServiceSpy.isAuthenticated$.next(authenticatedResult);

        expect(userIdentityServiceSpy.clearUserProfile).toHaveBeenCalled();
        expect(securityServiceSpy.logoffAndRevokeTokens).toHaveBeenCalled();
    }));

    it('should not call logout if unauthenticated', fakeAsync(() => {
        component.ngOnInit();
        const isAuthenticated = false;
        const authenticatedResult = new MockAuthenticatedResult(isAuthenticated);
        securityServiceSpy.isAuthenticated$.next(authenticatedResult);

        expect(userIdentityServiceSpy.clearUserProfile).toHaveBeenCalledTimes(0);
        expect(securityServiceSpy.logoffAndRevokeTokens).toHaveBeenCalledTimes(0);
    }));
});
