import { TestBed } from '@angular/core/testing';
import { AdminGuard } from './admin.guard';
import { Router } from '@angular/router';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { of } from 'rxjs';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: Router, useValue: router },
        { provide: UserIdentityService, useClass: UserIdentityServiceSpy }
      ],
    }).compileComponents();
    adminGuard = TestBed.get(AdminGuard);
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
