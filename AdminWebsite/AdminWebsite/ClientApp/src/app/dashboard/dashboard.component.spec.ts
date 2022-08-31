import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { UserProfileResponse } from '../services/clients/api-client';
import { LaunchDarklyService } from '../services/launch-darkly.service';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    const userIdentitySpy = jasmine.createSpyObj<UserIdentityService>('UserIdentityService', ['getUserInformation']);
    
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['flagChange']);
    launchDarklyServiceSpy.flagChange = new BehaviorSubject({ 'vho-work-allocation': false });
    
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
        
        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': false })
        await component.ngOnInit();
        expect(component.showWorkAllocation).toBeFalsy();
    });
    
    it('should show work allocation tile if feature is switched on and user is VHO', async () => {
        userIdentitySpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_case_administrator: true,
                    is_vh_officer_administrator_role: true
                })
            )
        );

        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': true })
        await component.ngOnInit();
        expect(component.showWorkAllocation).toBeTruthy();
    });
});
