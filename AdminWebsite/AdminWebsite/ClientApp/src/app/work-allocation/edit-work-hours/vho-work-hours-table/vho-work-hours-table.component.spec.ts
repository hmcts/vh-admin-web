import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ValidationFailure, VhoWorkHoursTableComponent } from './vho-work-hours-table.component';
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
            const validationFailure = new ValidationFailure();
            validationFailure.id = 1;
            validationFailure.errorMessage = 'Error';
            component.validationFailures = [validationFailure];
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

            expect(component.validationFailures.length).toBe(0);
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
            expect(component.validationFailures.length).toBe(0);
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
        beforeEach(() => {
            component.validationFailures = [];
            component.validationSummary = [];
        });

        it('should add end time before start time error', () => {
            const workHourDay = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                end_time: '09:00',
                start_time: '12:00'
            });

            component.validateTimes(workHourDay);

            expect(component.validationFailures.length).toBe(1);
            expect(component.validationFailures[0].id).toBe(1);
            expect(component.validationFailures[0].errorMessage).toBe(VhoWorkHoursTableComponent.ErrorEndTimeBeforeStartTime);
            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toBe(VhoWorkHoursTableComponent.ErrorEndTimeBeforeStartTime);
        });

        it('should remove end time before start time error when fixed', () => {
            const validationFailure = new ValidationFailure();
            validationFailure.id = 1;
            validationFailure.errorMessage = VhoWorkHoursTableComponent.ErrorEndTimeBeforeStartTime;
            component.validationFailures = [validationFailure];

            const workHourDay = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                end_time: '12:00',
                start_time: '09:00'
            });

            component.validateTimes(workHourDay);

            expect(component.validationFailures.length).toBe(0);
            expect(component.validationSummary.length).toBe(0);
        });

        it('should add start and end time both required error when start time is empty', () => {
            const workHourDay = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                end_time: '09:00'
            });

            component.validateTimes(workHourDay);

            expect(component.validationFailures.length).toBe(1);
            expect(component.validationFailures[0].id).toBe(1);
            expect(component.validationFailures[0].errorMessage).toBe(VhoWorkHoursTableComponent.ErrorStartAndEndTimeBothRequired);
            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toBe(VhoWorkHoursTableComponent.ErrorStartAndEndTimeBothRequired);
        });

        it('should add start and end time both required error when end time is empty', () => {
            const workHourDay = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                start_time: '09:00'
            });

            component.validateTimes(workHourDay);

            expect(component.validationFailures.length).toBe(1);
            expect(component.validationFailures[0].id).toBe(1);
            expect(component.validationFailures[0].errorMessage).toBe(VhoWorkHoursTableComponent.ErrorStartAndEndTimeBothRequired);
            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toBe(VhoWorkHoursTableComponent.ErrorStartAndEndTimeBothRequired);
        });

        it('should remove start and end time both required error when fixed', () => {
            const validationFailure = new ValidationFailure();
            validationFailure.id = 1;
            validationFailure.errorMessage = VhoWorkHoursTableComponent.ErrorStartAndEndTimeBothRequired;
            component.validationFailures = [validationFailure];

            const workHourDay = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                end_time: '12:00',
                start_time: '09:00'
            });

            component.validateTimes(workHourDay);

            expect(component.validationFailures.length).toBe(0);
            expect(component.validationSummary.length).toBe(0);
        });
    });

    describe('workHourIsValid', () => {
        it('should return true when work hour is valid', () => {
            const workHour = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                start_time: '09:00',
                end_time: '12:00'
            });
            component.validateTimes(workHour);
            const result = component.workHourIsValid(workHour.day_of_week_id);
            expect(result).toBe(true);
        });

        it('should return false when work hour is not valid', () => {
            const workHour = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                start_time: '09:00'
            });
            component.validateTimes(workHour);
            const result = component.workHourIsValid(workHour.day_of_week_id);
            expect(result).toBe(false);
        });
    });

    describe('onWorkHourFieldBlur', () => {
        it('should validate', () => {
            const workHour = new VhoWorkHoursResponse({
                day_of_week_id: 1,
                start_time: '09:00'
            });
            component.onWorkHourFieldBlur(workHour);
            const result = component.workHourIsValid(workHour.day_of_week_id);
            expect(result).toBe(false);
            expect(videoServiceSpy.setVhoNonAvailabiltiesHaveChanged).toHaveBeenCalledTimes(1);
        });
    });
});
