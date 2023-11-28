import { fakeAsync, TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';
import { IdpProviders, SecurityService } from '../services/security.service';
import { Logger } from '../../services/logger';
import { MockSecurityService } from '../../testing/mocks/MockOidcSecurityService';

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
                { provide: SecurityService, useClass: MockSecurityService },
                { provide: Router, useValue: router },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
        oidcSecurityService = TestBed.inject(SecurityService);
        authGuard = TestBed.inject(AuthGuard);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', () => {
            oidcSecurityService.setAuthenticatedResult(IdpProviders.main, true);
            authGuard.canActivate().subscribe(result => expect(result).toBeTruthy());
        });
    });

    describe('when login failed with unsuccessful authentication', () => {
        it('canActivate should return false', fakeAsync(() => {
            oidcSecurityService.setAuthenticatedResult(IdpProviders.main, false);
            authGuard.canActivate().subscribe(result => expect(result).toBeFalsy());
        }));
    });
});
