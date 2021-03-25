import { fakeAsync, TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { OidcSecurityService } from 'angular-auth-oidc-client';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let oidcSecurityService;
    const router = {
        navigate: jasmine.createSpy('navigate')
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AuthGuard, { provide: OidcSecurityService, useClass: MockOidcSecurityService }, { provide: Router, useValue: router }]
        }).compileComponents();
        oidcSecurityService = TestBed.inject(OidcSecurityService);
        authGuard = TestBed.inject(AuthGuard);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', () => {
            oidcSecurityService.setAuthenticated(true);
            authGuard.canActivate().subscribe(result =>
                expect(result).toBeTruthy()
            );
        });
    });

    describe('when login failed with unsuccessful authentication', () => {
        it('canActivate should return false', fakeAsync(() => {
            oidcSecurityService.setAuthenticated(false);
            authGuard.canActivate().subscribe(result =>
                expect(result).toBeFalsy()
            );
        }));
    });
});
