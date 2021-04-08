import { TestBed } from '@angular/core/testing';
import { AdminGuard } from './admin.guard';
import { Router } from '@angular/router';
import { ClientSettingsResponse, UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { of } from 'rxjs';
import { Logger } from '../services/logger';
import { ConfigService } from '../services/config.service';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { OidcSecurityService } from 'angular-auth-oidc-client';

const userProfileResponse: UserProfileResponse = new UserProfileResponse();

class UserIdentityServiceSpy {
    getUserInformation() {
        userProfileResponse.is_case_administrator = true;
        userProfileResponse.is_vh_officer_administrator_role = true;
        return of(userProfileResponse);
    }
}

describe('admin-guard', () => {
    let adminGuard: AdminGuard;
    const router = {
        navigate: jasmine.createSpy('navigate')
    };
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/dashboard',
        redirect_uri: '/dashboard'
    });
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'loadConfig']);
    configServiceSpy.getClientSettings.and.returnValue(of(clientSettings));
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AdminGuard,
                { provide: Router, useValue: router },
                { provide: UserIdentityService, useClass: UserIdentityServiceSpy },
                { provide: OidcSecurityService, useClass: MockOidcSecurityService },
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
        adminGuard = TestBed.inject(AdminGuard);
    });

    describe('when logged in with vh office admin role', () => {
        it('canActivate should return true', () => {
            expect(adminGuard.canActivate(null, null)).toBeTruthy();
        });
    });

    describe('when login with case admin or vh officer admin role', () => {
        it('canActivate should return true', () => {
            expect(adminGuard.canActivate(null, null)).toBeTruthy();
        });
    });
});
