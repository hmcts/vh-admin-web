import { Component, DebugElement, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { UserIdentityService } from '../services/user-identity.service';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { WorkAllocationComponent } from './work-allocation.component';
import { BHClient, UserProfileResponse } from '../services/clients/api-client';

@Component({
    selector: 'app-upload-work-hours',
    template: '<span class="govuk-details__summary-text" id="upload-availability"> Upload working hours / non-availability </span>'
})
class UploadWorkHoursStubComponent {}

@Component({
    selector: 'app-edit-work-hours',
    template: '<span class="govuk-details__summary-text" id="edit-availability">  Edit working hours / non-availability  </span>'
})
class EditWorkHoursStubComponent {}

@Component({
    selector: 'app-manage-team',
    template: '<span class="govuk-details__summary-text" id="manage-team">  Manage team  </span>'
})
class ManageTeamStubComponent {}

@Component({
    selector: 'app-allocate-hearings',
    template: '<span class="govuk-details__summary-text" id="allocate-hearings">  Allocate hearings  </span>'
})
class AllocateHearingsStubComponent {}

describe('WorkAllocationComponent', () => {
    let component: WorkAllocationComponent;
    let fixture: ComponentFixture<WorkAllocationComponent>;

    let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;

    userIdentityServiceSpy = jasmine.createSpyObj('UserIdentityService', ['getUserInformation']);
    userIdentityServiceSpy.getUserInformation.and.returnValue(
        of(
            new UserProfileResponse({
                is_vh_team_leader: true
            })
        )
    );

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [FontAwesomeTestingModule],
            declarations: [
                WorkAllocationComponent,
                UploadWorkHoursStubComponent,
                EditWorkHoursStubComponent,
                ManageTeamStubComponent,
                AllocateHearingsStubComponent
            ],
            providers: [{ provide: UserIdentityService, useValue: userIdentityServiceSpy }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkAllocationComponent);
        component = fixture.componentInstance;
        component.dataChangedBroadcast = jasmine.createSpyObj('dataChangedBroadcast', ['emit']);
        fixture.detectChanges();
    });

    describe('rendering', () => {
        it('should show vh team leader view', () => {
            component.isVhTeamLeader = true;

            fixture.detectChanges();

            const componentDebugElement: DebugElement = fixture.debugElement;
            const uploadHeader = componentDebugElement.query(By.css('#upload-availability')).nativeElement as HTMLSpanElement;
            expect(uploadHeader.textContent.trim()).toEqual(`Upload working hours / non-availability`);

            const manageTeamHeader = componentDebugElement.query(By.css('#manage-team')).nativeElement as HTMLSpanElement;
            expect(manageTeamHeader.textContent.trim()).toEqual(`Manage team`);

            const allocateHearingHeader = componentDebugElement.query(By.css('#allocate-hearings')).nativeElement as HTMLSpanElement;
            expect(allocateHearingHeader.textContent.trim()).toEqual(`Allocate hearings`);
        });

        it('should show vho view', () => {
            component.isVhTeamLeader = false;
            fixture.detectChanges();

            const componentDebugElement: DebugElement = fixture.debugElement;
            const uploadHeader = componentDebugElement.query(By.css('#upload-availability'));
            const manageTeamHeader = componentDebugElement.query(By.css('#manage-team'));
            const allocateHearingHeader = componentDebugElement.query(By.css('#allocate-hearings'));

            expect(uploadHeader).toBeFalsy();
            expect(manageTeamHeader).toBeFalsy();
            expect(allocateHearingHeader).toBeFalsy();
        });
    });

    it('should retrieve vh team leader status', () => {
        expect(component.isVhTeamLeader).toBeTruthy();
    });

    describe('validateStartTimeBeforeEndTime', () => {
        it('should call handleContinue and click on non working Option', async () => {
            await component.handleContinue();

            expect(component).toBeTruthy();
            expect(component.dataChangedBroadcast.emit).toHaveBeenCalledWith(false);
        });

        it('should call cancelEditing and emit dataChange', async () => {
            await component.cancelEditing();

            expect(component).toBeTruthy();
            expect(component.dataChangedBroadcast.emit).toHaveBeenCalledWith(true);
        });

        it('should call onDataChange and emit dataChange', async () => {
            await component.onDataChange(true);

            expect(component).toBeTruthy();
            expect(component.showSaveConfirmation).toBeTruthy();
        });
    });
});
