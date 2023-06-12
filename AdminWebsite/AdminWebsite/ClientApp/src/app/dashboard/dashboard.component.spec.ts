import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { UserProfileResponse } from '../services/clients/api-client';
import { FeatureFlags, LaunchDarklyService } from '../services/launch-darkly.service';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    const userIdentitySpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['getUserInformation']);

    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
    launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(true));
    launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.hrsIntegration).and.returnValue(of(false));

    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [DashboardComponent],
            providers: [
                { provide: UserIdentityService, useValue: userIdentitySpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
    });

    it('should show for VH officer checklist', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_case_administrator: false,
                    is_vh_officer_administrator_role: true
                })
            )
        );
        await component.ngOnInit();
        expect(component.showCheckList).toBeTruthy();
    });

    it('should show for VH officer and case admin booking', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_case_administrator: true,
                    is_vh_officer_administrator_role: true
                })
            )
        );
        await component.ngOnInit();
        expect(component.showBooking).toBeTruthy();
    });

    it('should not show work allocation toggle if user is not a VHO', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_case_administrator: true,
                    is_vh_officer_administrator_role: false
                })
            )
        );
        await component.ngOnInit();
        expect(component.showWorkAllocation).toBeFalsy();
    });

    it('should not show work allocation tile if user is not a VHO', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_case_administrator: true,
                    is_vh_officer_administrator_role: false
                })
            )
        );
        await component.ngOnInit();
        expect(component.showWorkAllocation).toBeFalsy();
    });

    it('should not show work allocation tile if feature is switched off', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_case_administrator: true,
                    is_vh_officer_administrator_role: true
                })
            )
        );

        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(false));

        await component.ngOnInit();
        expect(component.showWorkAllocation).toBeFalsy();
    });

    it('should show work allocation tile if feature is switched on and user is Team Leader', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_vh_team_leader: true
                })
            )
        );

        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(true));
        await component.ngOnInit();
        expect(component.showWorkAllocation).toBeTruthy();
    });

    it('should unsubscribe from launch darkly flag changes', () => {
        const unsubscribeSpy = spyOn(component.destroyed$, 'next');

        component.ngOnDestroy();

        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not show work allocation toggle if user is not Team Leader', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_vh_team_leader: false,
                    is_vh_officer_administrator_role: true
                })
            )
        );
        await component.ngOnInit();
        expect(component.showWorkAllocation).toBeFalsy();
    });
    it('should not show  link to audio file  if feature is switched on', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_vh_officer_administrator_role: false
                })
            )
        );

        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.hrsIntegration).and.returnValue(of(true));
        await component.ngOnInit();
        expect(component.showAudioFileLink).toBeFalsy();
    });

    it('should  show  link to audio file  if feature is switched off', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_vh_officer_administrator_role: true
                })
            )
        );

        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.hrsIntegration).and.returnValue(of(false));
        await component.ngOnInit();
        expect(component.showAudioFileLink).toBeTruthy();
    });
});
