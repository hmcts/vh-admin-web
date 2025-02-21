import { inject, TestBed } from "@angular/core/testing";
import { UserIdentityService } from "./user-identity.service";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { BHClient, UserProfileResponse } from "./clients/api-client";
import { of } from "rxjs";

describe('UserIdentityService', () => {
    const bhClientSpy = jasmine.createSpyObj('BHClient', ['getUserProfile']);

    beforeEach(() => {
        TestBed.configureTestingModule({
    imports: [],
    providers: [{ provide: BHClient, useValue: bhClientSpy }, UserIdentityService, provideHttpClient(withInterceptorsFromDi())]
});
    });

    it('should retrieve user profile from memory when it exists', inject([UserIdentityService], (service: UserIdentityService) => {
        const userProfile = new UserProfileResponse({
            is_case_administrator: false,
            is_vh_officer_administrator_role: true,
            is_vh_team_leader: true
        });

        service.profile = userProfile;

        service.getUserInformation().subscribe(result => {
            expect(result.is_case_administrator).toEqual(userProfile.is_case_administrator);
            expect(result.is_vh_officer_administrator_role).toEqual(userProfile.is_vh_officer_administrator_role);
            expect(result.is_vh_team_leader).toEqual(userProfile.is_vh_team_leader);
        });
    }));

    it('should retrieve user profile from api and save to memory', inject([UserIdentityService], (service: UserIdentityService) => {
        const userProfile = new UserProfileResponse({
            is_case_administrator: false,
            is_vh_officer_administrator_role: true,
            is_vh_team_leader: true
        });

        bhClientSpy.getUserProfile.and.returnValue(of(userProfile));

        service.getUserInformation().subscribe(result => {
            expect(result.is_case_administrator).toEqual(userProfile.is_case_administrator);
            expect(result.is_vh_officer_administrator_role).toEqual(userProfile.is_vh_officer_administrator_role);
            expect(result.is_vh_team_leader).toEqual(userProfile.is_vh_team_leader);
        });
    }));

    it('should clear set profile', inject([UserIdentityService], (service: UserIdentityService) => {
        const userProfile = new UserProfileResponse({
            is_case_administrator: false,
            is_vh_officer_administrator_role: true,
            is_vh_team_leader: true
        });

        service.profile = userProfile;
        service.clearUserProfile();
        expect(service.profile).toBeNull();
    }));
});
