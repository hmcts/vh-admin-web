import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { VhoWorkHoursTableComponent } from './vho-work-hours-table.component';
import { BHClient, VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { Logger } from '../../../services/logger';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { DatePipe } from '@angular/common';
import { FormBuilder } from '@angular/forms';

describe('VhoWorkHoursTableComponent', () => {
    let component: VhoWorkHoursTableComponent;
    let fixture: ComponentFixture<VhoWorkHoursTableComponent>;
    let videoServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    videoServiceSpy = jasmine.createSpyObj('VideoHearingsService', [
        'cancelVhoNonAvailabiltiesRequest',
        'setVhoNonAvailabiltiesHaveChanged'
    ]);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [{ provide: VideoHearingsService, useValue: videoServiceSpy }],
            declarations: [VhoWorkHoursTableComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VhoWorkHoursTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('UI tests', () => {
        it('should show work hours table when work hours not empty', () => {
            component.workHours = [new VhoWorkHoursResponse()];
            fixture.detectChanges();

            const workHoursTable = fixture.debugElement.query(By.css('#individual-work-hours-table')).nativeElement;

            expect(workHoursTable).toBeTruthy();
        });

        it('should not show work hours table when work hours are empty', () => {
            component.workHours = [];
            fixture.detectChanges();

            const workHoursTable = fixture.debugElement.query(By.css('#individual-work-hours-table'));

            expect(workHoursTable).toBeNull();
        });

        it('should switch to edit mode when edit button is clicked', () => {
            component.isEditing = false;
            const spy = spyOn(component, 'switchToEditMode');
            const editButton = fixture.debugElement.query(By.css('#edit-individual-work-hours-button')).nativeElement;

            editButton.click();
            fixture.detectChanges();

            expect(spy).toBeTruthy();
        });

        it('should save when save button is clicked', () => {
            component.isEditing = true;
            fixture.detectChanges();
            const spy = spyOn(component, 'saveWorkingHours');
            const saveButton = fixture.debugElement.query(By.css('#save-individual-work-hours-button')).nativeElement;

            saveButton.click();

            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should disable save button when errors exist', () => {
            component.isEditing = true;
            component.workHoursEndTimeBeforeStartTimeErrors = [0];
            fixture.detectChanges();

            const saveButton = fixture.debugElement.query(By.css('#save-individual-work-hours-button')).nativeElement;

            expect(saveButton.disabled).toBe(true);
        });

        it('should cancel editing mode when cancel button is clicked', () => {
            component.isEditing = true;
            fixture.detectChanges();
            const spy = spyOn(component, 'cancelEditingWorkingHours');
            const cancelButton = fixture.debugElement.query(By.css('#cancel-editing-individual-work-hours-button')).nativeElement;

            cancelButton.click();

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('cancelEditingWorkingHours', () => {
        it('should set edit mode to false', () => {
            component.isEditing = true;

            component.cancelEditingWorkingHours();

            expect(component.isEditing).toBeFalsy();
        });

        it('should reset errors', () => {
            component.isEditing = true;

            component.cancelEditingWorkingHours();

            expect(component.workHoursEndTimeBeforeStartTimeErrors.length).toBe(0);
        });

        it('should emit event', () => {
            component.isEditing = true;
            spyOn(component.cancelSaveWorkHours, 'emit');

            component.cancelEditingWorkingHours();

            expect(component.cancelSaveWorkHours.emit).toHaveBeenCalledTimes(1);
        });

        it('should set work hours back to original values', () => {
            const originalMondayWorkHours = new VhoWorkHoursResponse();
            originalMondayWorkHours.day_of_week_id = 1;
            originalMondayWorkHours.end_time = '17:00';
            originalMondayWorkHours.start_time = '09:00';

            const editedMondayWorkHours = new VhoWorkHoursResponse();
            originalMondayWorkHours.day_of_week_id = 1;
            originalMondayWorkHours.end_time = '17:00';
            originalMondayWorkHours.start_time = '09:00';

            component.originalWorkHours = [originalMondayWorkHours];

            component.workHours = [editedMondayWorkHours];

            component.switchToEditMode();

            expect(JSON.stringify(component.originalWorkHours)).toEqual(JSON.stringify(component.workHours));
        });
    });

    describe('saveWorkingHours', () => {
        it('should emit event', () => {
            const workHours = [
                new VhoWorkHoursResponse({
                    day_of_week_id: 1,
                    end_time: '12:00',
                    start_time: '09:00'
                })
            ] as VhoWorkHoursResponse[];

            component.workHours = workHours;

            spyOn(component.saveWorkHours, 'emit');
            component.saveWorkingHours();

            expect(component.saveWorkHours.emit).toHaveBeenCalledTimes(1);
            expect(component.saveWorkHours.emit).toHaveBeenCalledWith(component.workHours);
        });

        it('should reset state on successful upload', () => {
            const workHours = [
                new VhoWorkHoursResponse({
                    day_of_week_id: 1,
                    end_time: '12:00',
                    start_time: '09:00'
                })
            ] as VhoWorkHoursResponse[];

            component.workHours = workHours;

            spyOn(component.saveWorkHours, 'emit');
            component.saveWorkingHours();

            expect(component.isEditing).toBe(false);
            expect(component.workHoursEndTimeBeforeStartTimeErrors.length).toBe(0);
        });
    });

    describe('switchToEditMode', () => {
        it('should set component to editing when work hours are not empty', () => {
            component.isEditing = false;
            component.workHours = [new VhoWorkHoursResponse()];

            component.switchToEditMode();

            expect(component.isEditing).toBeTruthy();
        });

        it('should not set component to editing when work hours is empty', () => {
            component.isEditing = false;
            component.workHours = [];

            component.switchToEditMode();

            expect(component.isEditing).toBeFalsy();
        });

        it('should make a copy of original work hours', () => {
            const mondayWorkHours = new VhoWorkHoursResponse();
            mondayWorkHours.day_of_week_id = 1;
            mondayWorkHours.end_time = '17:00';
            mondayWorkHours.start_time = '09:00';

            component.workHours = [mondayWorkHours];

            component.switchToEditMode();

            expect(JSON.stringify(component.originalWorkHours)).toEqual(JSON.stringify(component.workHours));
        });

        it('should emit event when work hours are not empty', () => {
            const mondayWorkHours = new VhoWorkHoursResponse();
            mondayWorkHours.day_of_week_id = 1;
            mondayWorkHours.end_time = '17:00';
            mondayWorkHours.start_time = '09:00';

            spyOn(component.editWorkHours, 'emit');
            component.workHours = [mondayWorkHours];

            component.switchToEditMode();

            expect(component.editWorkHours.emit).toHaveBeenCalledTimes(1);
        });
    });

    it('check results input parameter sets the value', () => {
        component.result = [new VhoWorkHoursResponse()];
        fixture.detectChanges();
        expect(component.workHours).toEqual([new VhoWorkHoursResponse()]);
    });

    it('check results input parameter sets to null', () => {
        component.result = null;
        fixture.detectChanges();
        expect(component.workHours).toBeNull();
    });

    it('check results input parameter, when wrong type sets to null', () => {
        component.result = [new VhoNonAvailabilityWorkHoursResponse()];
        fixture.detectChanges();
        expect(component.workHours).toBeNull();
    });

    describe('validateTimes', () => {
        it('should add end time before start time error', () => {
            const workHourDay = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                end_time: '09:00',
                start_time: '12:00'
            });

            component.validateTimes(workHourDay);

            expect(component.workHoursEndTimeBeforeStartTimeErrors.length).toBe(1);
            expect(component.workHoursEndTimeBeforeStartTimeErrors[0]).toBe(0);
        });

        it('should remove end time before start time error when fixed', () => {
            component.workHoursEndTimeBeforeStartTimeErrors = [0];

            const workHourDay = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                end_time: '12:00',
                start_time: '09:00'
            });

            component.validateTimes(workHourDay);

            expect(component.workHoursEndTimeBeforeStartTimeErrors.length).toBe(0);
        });
    });
});
