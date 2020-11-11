import { TestBed } from '@angular/core/testing';
import { VhOfficerAdminGuard } from './vh-officer-admin.guard';
import { Router } from '@angular/router';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { of } from 'rxjs';
import { Logger } from '../services/logger';

const userProfileResponse: UserProfileResponse = new UserProfileResponse();

class UserIdentityServiceSpy {
    getUserInformation() {
        userProfileResponse.is_vh_officer_administrator_role = true;
        return of(userProfileResponse);
    }
}
class UserIdentityServiceSpy1 {
    getUserInformation() {
        userProfileResponse.is_vh_officer_administrator_role = false;
        return of(userProfileResponse);
    }
}
let vhOfficerGuard: VhOfficerAdminGuard;
const router = {
    navigate: jasmine.createSpy('navigate')
};
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
describe('vh-officer-admin-guard', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                VhOfficerAdminGuard,
                { provide: Router, useValue: router },
                { provide: UserIdentityService, useClass: UserIdentityServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
        vhOfficerGuard = TestBed.inject(VhOfficerAdminGuard);
    });

    describe('when logged in with vh office admin role', () => {
        it('canActivate should return true', () => {
            expect(vhOfficerGuard.canActivate(null, null)).toBeTruthy();
        });
    });
});
