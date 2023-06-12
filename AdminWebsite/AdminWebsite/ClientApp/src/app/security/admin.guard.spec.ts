import { TestBed } from '@angular/core/testing';
import { AdminGuard } from './admin.guard';
import { Router } from '@angular/router';
import { UserIdentityService } from '../services/user-identity.service';
import { of } from 'rxjs';
import { Logger } from '../services/logger';
import { UserProfileResponse } from '../services/clients/api-client';

describe('admin-guard', () => {
    let adminGuard: AdminGuard;
    const router = {
        navigate: jasmine.createSpy('navigate')
    };
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
    const UserIdentityServiceSpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['getUserInformation']);
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AdminGuard,
                { provide: Router, useValue: router },
                { provide: UserIdentityService, useValue: UserIdentityServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
        adminGuard = TestBed.inject(AdminGuard);
    });

    describe('when logged in with vh office admin role', () => {
        it('canActivate should return true', () => {
            UserIdentityServiceSpy.getUserInformation.and.returnValue(
                of(
                    new UserProfileResponse({
                        is_vh_officer_administrator_role: true,
                        is_case_administrator: false
                    })
                )
            );
            adminGuard.canActivate(null, null).subscribe(result => expect(result).toBeTruthy());
        });
    });

    describe('when login with case admin or vh officer admin role', () => {
        it('canActivate should return true', () => {
            UserIdentityServiceSpy.getUserInformation.and.returnValue(
                of(
                    new UserProfileResponse({
                        is_vh_officer_administrator_role: false,
                        is_case_administrator: true
                    })
                )
            );
            adminGuard.canActivate(null, null).subscribe(result => expect(result).toBeTruthy());
        });
    });

    describe('when not logged in', () => {
        it('canActivate should return false', () => {
            UserIdentityServiceSpy.getUserInformation.and.returnValue(
                of(
                    new UserProfileResponse({
                        is_vh_officer_administrator_role: false,
                        is_case_administrator: false
                    })
                )
            );
            adminGuard.canActivate(null, null).subscribe(result => expect(result).toBeFalsy());
        });
    });
});
