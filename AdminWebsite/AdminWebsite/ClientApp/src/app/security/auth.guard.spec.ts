import { fakeAsync, TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Logger } from '../services/logger';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let oidcSecurityService;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
    const router = {
        navigate: jasmine.createSpy('navigate')
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AuthGuard,
                { provide: OidcSecurityService, useClass: MockOidcSecurityService },
                { provide: Router, useValue: router },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
        oidcSecurityService = TestBed.inject(OidcSecurityService);
        authGuard = TestBed.inject(AuthGuard);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', () => {
            oidcSecurityService.setAuthenticated(true);
            authGuard.canActivate().subscribe(result => expect(result).toBeTruthy());
        });
    });

    describe('when login failed with unsuccessful authentication', () => {
        it('canActivate should return false', fakeAsync(() => {
            oidcSecurityService.setAuthenticated(false);
            authGuard.canActivate().subscribe(result => expect(result).toBeFalsy());
        }));
    });
});
