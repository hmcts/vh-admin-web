import { Component, DebugElement, EventEmitter, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { UserIdentityService } from '../services/user-identity.service';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { WorkAllocationComponent } from './work-allocation.component';
import { UserProfileResponse } from '../services/clients/api-client';
import { FeatureFlags, LaunchDarklyService } from '../services/launch-darkly.service';

@Component({
    selector: 'app-upload-work-hours',
    template: '<span class="govuk-details__summary-text" id="upload-availability"> Upload working hours / non-availability </span>',
    standalone: false
})
class UploadWorkHoursStubComponent {}

@Component({
    selector: 'app-edit-work-hours',
    template: '<span class="govuk-details__summary-text" id="edit-availability">  Edit working hours / non-availability  </span>',
    standalone: false
})
class EditWorkHoursStubComponent {
    @Input() isVhTeamLeader: boolean;
    @Input() dataChangedBroadcast = new EventEmitter<boolean>();
}

@Component({
    selector: 'app-manage-team',
    template: '',
    standalone: false
})
class ManageTeamStubComponent {
    @Input() showHeader = true;
}

@Component({
    selector: 'app-allocate-hearings',
    template: '<span class="govuk-details__summary-text" id="allocate-hearings">  Allocate hearings  </span>',
    standalone: false
})
class AllocateHearingsStubComponent {}

describe('WorkAllocationComponent', () => {
    let component: WorkAllocationComponent;
    let fixture: ComponentFixture<WorkAllocationComponent>;

    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
    const userIdentityServiceSpy = jasmine.createSpyObj('UserIdentityService', ['getUserInformation']);

    beforeEach(() => {
        userIdentityServiceSpy.getUserInformation.and.returnValue(
            of(
                new UserProfileResponse({
                    is_vh_team_leader: true
                })
            )
        );

        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.dom1Integration).and.returnValue(of(true));
        TestBed.configureTestingModule({
            imports: [FontAwesomeTestingModule],
            declarations: [
                WorkAllocationComponent,
                UploadWorkHoursStubComponent,
                EditWorkHoursStubComponent,
                ManageTeamStubComponent,
                AllocateHearingsStubComponent
            ],
            providers: [
                { provide: UserIdentityService, useValue: userIdentityServiceSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkAllocationComponent);
        component = fixture.componentInstance;
        component.dataChangedBroadcast = jasmine.createSpyObj('dataChangedBroadcast', ['emit']);
        fixture.detectChanges();
    });

    describe('rendering', () => {
        describe('dom1 feature toggle on', () => {
            beforeEach(() => {
                component.dom1FeatureEnabled = true;
            });
            it('should show vh team leader view', () => {
                component.isVhTeamLeader = true;

                fixture.detectChanges();

                const componentDebugElement: DebugElement = fixture.debugElement;
                const uploadHeader = componentDebugElement.query(By.css('#upload-availability')).nativeElement as HTMLSpanElement;
                expect(uploadHeader.textContent.trim()).toEqual(`Upload working hours / non-availability`);

                const manageTeamHeader = componentDebugElement.query(By.css('#manage-team'));
                expect(manageTeamHeader).toBeFalsy();

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

        describe('dom1 feature toggle off', () => {
            beforeEach(() => {
                component.dom1FeatureEnabled = false;
            });

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

    describe('ngOnDestroy', () => {
        it('should call next to destroyed subject', fakeAsync(() => {
            const unsubscribeSpy = spyOn(component.destroyed$, 'next');

            component.ngOnDestroy();

            expect(unsubscribeSpy).toHaveBeenCalled();
        }));
    });
});
