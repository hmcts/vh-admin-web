import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, ReplaySubject, Subscription } from 'rxjs';
import { UserProfileResponse } from '../services/clients/api-client';
import { LaunchDarklyService } from '../services/launch-darkly.service';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    const userIdentitySpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['getUserInformation']);

    const launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['flagChange']);
    launchDarklyServiceSpy.flagChange = new ReplaySubject();
    launchDarklyServiceSpy.flagChange.next({ admin_search: true });

    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [RouterTestingModule],
                declarations: [DashboardComponent],
                providers: [
                    { provide: UserIdentityService, useValue: userIdentitySpy },
                    { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                    { provide: Logger, useValue: loggerSpy }
                ]
            }).compileComponents();
        })
    );

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

        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': false });
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

        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': true });
        await component.ngOnInit();
        expect(component.showWorkAllocation).toBeTruthy();
    });

    it('should unsubscribe from launch darkly flag changes', () => {
        component.$ldSubcription = new Subscription();
        const unsubscribeSpy = spyOn(component.$ldSubcription, 'unsubscribe');

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

        launchDarklyServiceSpy.flagChange.next({ 'hrs-integration': true });
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

        launchDarklyServiceSpy.flagChange.next({ 'hrs-integration': false });
        await component.ngOnInit();
        expect(component.showAudioFileLink).toBeTruthy();
    });
});
