import { fakeAsync } from '@angular/core/testing';
import { UserIdentityService } from '../services/user-identity.service';
import { LogoutComponent } from './logout.component';
import { MockSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { IdpProviders } from './services/security.service';

describe('LogoutComponent', () => {
    let component: LogoutComponent;
    let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;

    const mockOidcSecurityService = new MockSecurityService();
    let oidcSecurityService;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        userIdentityServiceSpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['clearUserProfile']);
    });

    beforeEach(() => {
        userIdentityServiceSpy.clearUserProfile.calls.reset();
        component = new LogoutComponent(oidcSecurityService, userIdentityServiceSpy);
    });

    it('should call logout if authenticated', fakeAsync(() => {
        oidcSecurityService.setAuthenticatedResult(IdpProviders.main, true);
        component.ngOnInit();
        expect(userIdentityServiceSpy.clearUserProfile).toHaveBeenCalled();
    }));

    it('should not call logout if unauthenticated', fakeAsync(() => {
        component.ngOnInit();
        oidcSecurityService.setAuthenticatedResult(IdpProviders.main, false);
        expect(userIdentityServiceSpy.clearUserProfile).toHaveBeenCalledTimes(0);
    }));
});
