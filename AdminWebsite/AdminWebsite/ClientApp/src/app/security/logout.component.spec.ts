import { fakeAsync, flush } from "@angular/core/testing";
import { OidcSecurityService } from "angular-auth-oidc-client";
import { Subject } from "rxjs";
import { UserIdentityService } from "../services/user-identity.service";
import { LogoutComponent } from "./logout.component";

describe('LogoutComponent', () => {
    let component: LogoutComponent;
    let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;
    let securityServiceSpy;

    beforeAll(() => {
        securityServiceSpy = jasmine.createSpyObj<OidcSecurityService>('OidcSecurityService', ['logoffAndRevokeTokens', 'isAuthenticated$'])
        userIdentityServiceSpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['clearUserProfile']);
    });

    beforeEach(() => {
        securityServiceSpy.isAuthenticated$ = new Subject<boolean>();
        userIdentityServiceSpy.clearUserProfile.calls.reset();
        securityServiceSpy.logoffAndRevokeTokens.calls.reset();

        component = new LogoutComponent(securityServiceSpy, userIdentityServiceSpy);
    });

    it('should call logout if authenticated', fakeAsync(() => {
        component.ngOnInit();
        securityServiceSpy.isAuthenticated$.next(true);

        expect(userIdentityServiceSpy.clearUserProfile).toHaveBeenCalled();
        expect(securityServiceSpy.logoffAndRevokeTokens).toHaveBeenCalled();
    }));

    it('should not call logout if unauthenticated', fakeAsync(() => {
        component.ngOnInit();
        securityServiceSpy.isAuthenticated$.next(false);

        expect(userIdentityServiceSpy.clearUserProfile).toHaveBeenCalledTimes(0);
        expect(securityServiceSpy.logoffAndRevokeTokens).toHaveBeenCalledTimes(0);
    }));
});

