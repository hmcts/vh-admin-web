import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BHClient, VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { Logger } from '../../../services/logger';
import { ConfirmDeleteHoursPopupComponent } from '../../../popups/confirm-delete-popup/confirm-delete-popup.component';
import { of, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ValidationFailure, VhoWorkHoursNonAvailabilityTableComponent } from './vho-work-hours-non-availability-table.component';
import { EditVhoNonAvailabilityWorkHoursModel } from '../edit-non-work-hours-model';
import { Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { HoursType } from '../../../common/model/hours-type';
import { FormBuilder } from '@angular/forms';
import { VideoHearingsService } from '../../../services/video-hearings.service';

describe('VhoNonAvailabilityWorkHoursTableComponent', () => {
    let component: VhoWorkHoursNonAvailabilityTableComponent;
    let fixture: ComponentFixture<VhoWorkHoursNonAvailabilityTableComponent>;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let videoServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    videoServiceSpy = jasmine.createSpyObj('VideoHearingsService', [
        'cancelVhoNonAvailabiltiesRequest',
        'setVhoNonAvailabiltiesHaveChanged'
    ]);

    beforeEach(async () => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['deleteNonAvailabilityWorkHours']);
        bHClientSpy.deleteNonAvailabilityWorkHours.and.returnValue(of({ value: 0 }));
        loggerSpy = jasmine.createSpyObj('Logger', ['info', 'error']);
        await TestBed.configureTestingModule({
            providers: [
                { provide: Logger, useValue: loggerSpy },
                { provide: BHClient, useValue: bHClientSpy },
                { provide: VideoHearingsService, useValue: videoServiceSpy },
                DatePipe,
                FormBuilder
            ],
            declarations: [VhoWorkHoursNonAvailabilityTableComponent, ConfirmDeleteHoursPopupComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VhoWorkHoursNonAvailabilityTableComponent);
        component = fixture.componentInstance;
        component.saveNonWorkHoursCompleted$ = new Subject<boolean>();
        fixture.detectChanges();
    });

    it('check results input parameter sets the value', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            start_time: new Date(2022, 1, 1, 6, 0, 0),
            end_time: new Date(2022, 1, 1, 8, 0, 0)
        });
        const slotMapped = component.mapNonWorkingHoursToEditModel(slot);
        component.result = [slot];
        fixture.detectChanges();
        expect(component.nonWorkHours).toEqual([slotMapped]);
    });

    it('check the slot is not removed if confirmation is popup is false', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            start_time: new Date(2022, 1, 1, 6, 0, 0),
            end_time: new Date(2022, 1, 1, 8, 0, 0)
        });
        const slotMapped = component.mapNonWorkingHoursToEditModel(slot);
        component.result = [slot];
        component.delete(slotMapped);
        component.onDeletionAnswer(false);
        fixture.detectChanges();
        expect(component.nonWorkHours).toEqual([slotMapped]);
        expect(bHClientSpy.deleteNonAvailabilityWorkHours).toHaveBeenCalledTimes(0);
        expect(component.displayConfirmPopup).toBeFalsy();
    });

    it('check results input parameter with populated values sets the value', () => {
        const nonWorkHours: EditVhoNonAvailabilityWorkHoursModel[] = [];
        const nonWorkHoursPassed: VhoNonAvailabilityWorkHoursResponse[] = [];
        let slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            start_time: new Date(2022, 1, 1, 6, 0, 0),
            end_time: new Date(2022, 1, 1, 8, 0, 0)
        });
        let slotMapped = component.mapNonWorkingHoursToEditModel(slot);
        nonWorkHours.push(slotMapped);
        nonWorkHoursPassed.push(slot);

        slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            start_time: new Date(2022, 1, 1, 6, 0, 0),
            end_time: new Date(2022, 1, 1, 8, 0, 0)
        });
        slotMapped = component.mapNonWorkingHoursToEditModel(slot);

        nonWorkHours.push(slotMapped);
        nonWorkHoursPassed.push(slot);

        component.result = nonWorkHoursPassed;
        fixture.detectChanges();

        expect(JSON.stringify(component.nonWorkHours)).toEqual(JSON.stringify(nonWorkHours));
    });

    it('check results input parameter sets to null', () => {
        component.result = null;
        fixture.detectChanges();
        expect(component.nonWorkHours).toBe(null);
    });

    it('check results input parameter, when wrong type sets to null', () => {
        component.result = [new EditVhoNonAvailabilityWorkHoursModel()];
        fixture.detectChanges();
        expect(component.nonWorkHours).toBe(null);
    });

    it('check remove slot from result when confirm deletion', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse();
        component.result = [slot];
        const slotMapped = component.mapNonWorkingHoursToEditModel(slot);
        component.delete(slotMapped);
        component.onDeletionAnswer(true);
        fixture.detectChanges();

        expect(component.nonWorkHours.length).toEqual(0);
        expect(component.displayConfirmPopup).toBeFalsy();
    });

    it('Delete newly created slot', () => {
        component.nonWorkHours = [new EditVhoNonAvailabilityWorkHoursModel()];
        component.addNewNonAvailabilityRow();
        const slot = component.nonWorkHours[component.nonWorkHours.length - 1];

        expect(component.nonWorkHours.length).toEqual(2);
        component.delete(slot);
        fixture.detectChanges();

        expect(component.nonWorkHours.length).toEqual(1);
        expect(component.displayConfirmPopup).toBeFalsy();
    });

    it('check slot not removed from result when confirm deletion but error in api', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            start_time: new Date(2022, 1, 1, 6, 0, 0),
            end_time: new Date(2022, 1, 1, 8, 0, 0)
        });
        const slotMapped = component.mapNonWorkingHoursToEditModel(slot);
        bHClientSpy.deleteNonAvailabilityWorkHours.and.returnValue(throwError({ status: 500 }));
        component.result = [slot];
        component.delete(slotMapped);
        component.onDeletionAnswer(true);
        fixture.detectChanges();
        expect(component.nonWorkHours.length).toEqual(1);
        expect(component.displayConfirmPopup).toBeFalsy();
        expect(loggerSpy.error).toHaveBeenCalledTimes(1);
    });

    describe('editing non availability', () => {
        const ERROR_START_DATE_REQUIRED = VhoWorkHoursNonAvailabilityTableComponent.ErrorStartDateRequired;
        const ERROR_END_DATE_REQUIRED = VhoWorkHoursNonAvailabilityTableComponent.ErrorEndDateRequired;
        const ERROR_END_TIME_CANNOT_BE_BEFORE_START_TIME = VhoWorkHoursNonAvailabilityTableComponent.ErrorEndTimeCannotBeBeforeStartTime;
        const ERROR_END_DATETIME_MUST_BE_AFTER_START_DATETIME =
            VhoWorkHoursNonAvailabilityTableComponent.ErrorEndDatetimeMustBeAfterStartDatetime;
        const ERROR_OVERLAPPING_DATETIMES = VhoWorkHoursNonAvailabilityTableComponent.ErrorOverlappingDatetimes;
        const ERROR_START_TIME_REQUIRED = VhoWorkHoursNonAvailabilityTableComponent.ErrorStartTimeRequired;
        const ERROR_END_TIME_REQUIRED = VhoWorkHoursNonAvailabilityTableComponent.ErrorEndTimeRequired;

        beforeEach(() => {
            const nonWorkHours: EditVhoNonAvailabilityWorkHoursModel[] = [];
            const slot = new VhoNonAvailabilityWorkHoursResponse({
                id: 1,
                start_time: new Date(2022, 0, 1, 8, 0, 0),
                end_time: new Date(2022, 0, 1, 10, 0, 0)
            });
            const slotMapped = component.mapNonWorkingHoursToEditModel(slot);
            nonWorkHours.push(slotMapped);

            component.result = [slot];
            component.isEditing = false;
            component.ngOnInit();
            fixture.detectChanges();
        });

        describe('edit button clicked', () => {
            it('should switch to edit mode', () => {
                spyOn(component.editNonWorkHours, 'emit');
                const editButton = fixture.debugElement.query(By.css('#edit-individual-non-work-hours-button')).nativeElement;
                editButton.click();
                fixture.detectChanges();

                expect(component.isEditing).toBe(true);
                expect(JSON.stringify(component.originalNonWorkHours)).toEqual(JSON.stringify(component.nonWorkHours));
                expect(component.editNonWorkHours.emit).toHaveBeenCalledTimes(1);
            });
        });

        describe('cancel button clicked', () => {
            it('should switch to read mode', () => {
                spyOn(component.cancelSaveNonWorkHours, 'emit');
                component.switchToEditMode();
                fixture.detectChanges();

                const cancelButton = fixture.debugElement.query(By.css('#cancel-editing-individual-non-work-hours-button')).nativeElement;
                cancelButton.click();
                fixture.detectChanges();

                expect(component.isEditing).toBe(false);
                expect(JSON.stringify(component.nonWorkHours)).toEqual(JSON.stringify(component.originalNonWorkHours));
                expect(component.cancelSaveNonWorkHours.emit).toHaveBeenCalledTimes(1);
            });

            it('should revert non work hour changes', () => {
                component.switchToEditMode();
                const originalNonWorkHours = JSON.parse(JSON.stringify(component.nonWorkHours));
                const updatedWorkHour = component.nonWorkHours[0];
                updatedWorkHour.start_date = '2022-1-2';
                updatedWorkHour.end_date = '2022-1-2';
                fixture.detectChanges();

                const cancelButton = fixture.debugElement.query(By.css('#cancel-editing-individual-non-work-hours-button')).nativeElement;
                cancelButton.click();
                fixture.detectChanges();

                expect(JSON.stringify(component.nonWorkHours)).toEqual(JSON.stringify(originalNonWorkHours));
            });
        });

        describe('save button clicked', () => {
            it('should emit save event', () => {
                component.switchToEditMode();
                fixture.detectChanges();
                spyOn(component.saveNonWorkHours, 'emit');

                const saveButton = fixture.debugElement.query(By.css('#save-individual-non-work-hours-button')).nativeElement;
                saveButton.click();
                fixture.detectChanges();

                expect(component.isSaving).toBe(true);
                expect(component.saveNonWorkHours.emit).toHaveBeenCalledTimes(1);
                expect(component.saveNonWorkHours.emit).toHaveBeenCalledWith(component.nonWorkHours);
            });
        });

        describe('ngOnInit', () => {
            it('handles save non work hours on success', () => {
                component.switchToEditMode();
                component.ngOnInit();
                component.saveNonWorkHoursCompleted$.next(true);

                expect(component.isSaving).toBe(false);
                expect(component.isEditing).toBe(false);
                expect(JSON.stringify(component.originalNonWorkHours)).toEqual(JSON.stringify(component.nonWorkHours));
            });

            it('handles save non work hours on fail', () => {
                component.switchToEditMode();
                component.ngOnInit();
                const originalNonWorkHours = JSON.parse(JSON.stringify(component.nonWorkHours));
                component.saveNonWorkHoursCompleted$.next(false);

                expect(component.isSaving).toBe(false);
                expect(component.isEditing).toBe(true);
                expect(JSON.stringify(component.originalNonWorkHours)).toEqual(JSON.stringify(originalNonWorkHours));
            });
        });

        describe('addNewNonAvailabilityRow', () => {
            it('should add new row and validate', () => {
                const originalNonWorkHoursLength = component.nonWorkHours.length;
                const spy = spyOn(component, 'onStartDateBlur');

                component.addNewNonAvailabilityRow();
                const addedNonWorkHours = component.nonWorkHours[component.nonWorkHours.length - 1];

                expect(component.nonWorkHours.length).toBe(originalNonWorkHoursLength + 1);
                expect(addedNonWorkHours.end_date).toBe(addedNonWorkHours.start_date);
                expect(addedNonWorkHours.end_time).toBe(addedNonWorkHours.start_time);
                expect(spy).toHaveBeenCalledTimes(1);
                expect(component.isEditing).toBe(true);
            });
        });

        describe('onStartDateBlur', () => {
            const elementPrefix = 'start-date';

            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('fails validation when start date is empty', () => {
                const nonWorkHour = component.nonWorkHours[0];
                nonWorkHour.start_date = '';

                const elementId = `#${elementPrefix}_${nonWorkHour.id}`;
                triggerBlurEvent(elementId);

                expect(component.validationSummary.length).toBe(1);
                expect(component.validationSummary[0]).toEqual(ERROR_START_DATE_REQUIRED);
                expect(component.validationFailures.length).toBe(1);
                const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
                expect(validationFailure).not.toEqual(null);
                expect(validationFailure.id).toBe(nonWorkHour.id);
                expect(validationFailure.errorMessage).toBe(ERROR_START_DATE_REQUIRED);
                assertSaveButtonIsDisabled();
            });

            it('fails validation when end time is before start time on same day', () => {
                checkValidationFailsWhenEndTimeIsBeforeStartTime(elementPrefix);
            });

            it('fails validation when start and end datetimes match', () => {
                checkValidationFailsWhenStartAndEndDatetimesMatch(elementPrefix);
            });

            it('fails validation when datetimes overlap with another non work hour', () => {
                checkValidationFailsWhenDatetimesOverlap(elementPrefix);
            });

            it('removes previous validation error when valid', () => {
                const nonWorkHourIdWithValidData = 1;
                const previousValidationError = ERROR_START_DATE_REQUIRED;
                const previousValidationFailures: ValidationFailure[] = [];
                const failure1 = new ValidationFailure();
                failure1.id = nonWorkHourIdWithValidData;
                failure1.errorMessage = ERROR_START_DATE_REQUIRED;
                const failure2 = new ValidationFailure();
                failure2.id = 2;
                failure2.errorMessage = ERROR_END_TIME_CANNOT_BE_BEFORE_START_TIME;
                previousValidationFailures.push(failure1);
                previousValidationFailures.push(failure2);
                const previousDistinctValidationFailures: string[] = [];
                previousDistinctValidationFailures.push(ERROR_START_DATE_REQUIRED);
                previousDistinctValidationFailures.push(ERROR_END_TIME_CANNOT_BE_BEFORE_START_TIME);
                component.validationFailures = [...previousValidationFailures];
                component.validationSummary = [...previousDistinctValidationFailures];

                const elementId = `#${elementPrefix}_${nonWorkHourIdWithValidData}`;
                triggerBlurEvent(elementId);

                expect(component.validationFailures.length).toBe(previousValidationFailures.length - 1);
                const previousFailure = component.validationFailures.find(
                    x => x.id === nonWorkHourIdWithValidData && x.errorMessage === previousValidationError
                );
                expect(previousFailure).toBeUndefined();
                expect(component.validationSummary.length).toBe(previousDistinctValidationFailures.length - 1);
                const previousError = component.validationSummary.find(x => x === previousValidationError);
                expect(previousError).toBeUndefined();
            });

            it('does not repeat validation errors', () => {
                component.nonWorkHours = [];
                const workHour1 = new EditVhoNonAvailabilityWorkHoursModel();
                workHour1.id = 1;
                workHour1.start_date = '';
                workHour1.start_time = '06:00';
                workHour1.end_date = '';
                workHour1.end_time = '08:00';
                const workHour2 = new EditVhoNonAvailabilityWorkHoursModel();
                workHour2.id = 2;
                workHour2.start_date = '';
                workHour2.start_time = '08:00';
                workHour2.end_date = '';
                workHour2.end_time = '10:00';
                component.nonWorkHours.push(workHour1);
                component.nonWorkHours.push(workHour2);

                component.nonWorkHours.forEach(workHour => {
                    component.onStartDateBlur(workHour);
                    fixture.detectChanges();
                });

                expect(component.validationFailures.length).toBe(2);
                expect(component.validationSummary.length).toBe(1);
                expect(component.validationSummary[0]).toBe(ERROR_START_DATE_REQUIRED);
            });
        });

        describe('onEndDateBlur', () => {
            const elementPrefix = 'end-date';

            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('fails validation when end date is empty', () => {
                const nonWorkHour = component.nonWorkHours[0];
                nonWorkHour.end_date = '';

                const elementId = `#${elementPrefix}_${nonWorkHour.id}`;
                triggerBlurEvent(elementId);

                expect(component.validationSummary.length).toBe(1);
                expect(component.validationSummary[0]).toEqual(ERROR_END_DATE_REQUIRED);
                expect(component.validationFailures.length).toBe(1);
                const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
                expect(validationFailure).not.toEqual(null);
                expect(validationFailure.id).toBe(nonWorkHour.id);
                expect(validationFailure.errorMessage).toBe(ERROR_END_DATE_REQUIRED);
                assertSaveButtonIsDisabled();
            });

            it('fails validation when end time is before start time on same day', () => {
                checkValidationFailsWhenEndTimeIsBeforeStartTime(elementPrefix);
            });

            it('fails validation when start and end datetimes match', () => {
                checkValidationFailsWhenStartAndEndDatetimesMatch(elementPrefix);
            });

            it('fails validation when datetimes overlap with another non work hour', () => {
                checkValidationFailsWhenDatetimesOverlap(elementPrefix);
            });
        });

        describe('onStartTimeBlur', () => {
            const elementPrefix = 'start-time';

            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('fails validation when end time is before start time on same day', () => {
                checkValidationFailsWhenEndTimeIsBeforeStartTime(elementPrefix);
            });

            it('fails validation when start and end datetimes match', () => {
                checkValidationFailsWhenStartAndEndDatetimesMatch(elementPrefix);
            });

            it('fails validation when datetimes overlap with another non work hour', () => {
                checkValidationFailsWhenDatetimesOverlap(elementPrefix);
            });

            it('fails validation when start time is empty', () => {
                checkValidationFailsWhenStartTimeIsEmpty(elementPrefix);
            });
        });

        describe('onEndTimeBlur', () => {
            const elementPrefix = 'end-time';

            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('fails validation when end time is before start time on same day', () => {
                checkValidationFailsWhenEndTimeIsBeforeStartTime(elementPrefix);
            });

            it('fails validation when start and end datetimes match', () => {
                checkValidationFailsWhenStartAndEndDatetimesMatch(elementPrefix);
            });

            it('fails validation when datetimes overlap with another non work hour', () => {
                checkValidationFailsWhenDatetimesOverlap(elementPrefix);
            });

            it('fails validation when end time is empty', () => {
                checkValidationFailsWhenEndTimeIsEmpty(elementPrefix);
            });
        });

        function assertSaveButtonIsDisabled() {
            const saveButton = fixture.debugElement.query(By.css('#save-individual-non-work-hours-button')).nativeElement;
            expect(saveButton.getAttribute('disabled')).toEqual('');
        }

        function checkValidationFailsWhenEndTimeIsBeforeStartTime(elementPrefix: string) {
            const nonWorkHour = component.nonWorkHours[0];
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '08:00:00';
            nonWorkHour.end_date = '2022-01-01';
            nonWorkHour.end_time = '06:00:00';

            const elementId = `#${elementPrefix}_${nonWorkHour.id}`;
            triggerBlurEvent(elementId);

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_END_TIME_CANNOT_BE_BEFORE_START_TIME);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(nonWorkHour.id);
            expect(validationFailure.errorMessage).toBe(ERROR_END_TIME_CANNOT_BE_BEFORE_START_TIME);
            assertSaveButtonIsDisabled();
        }

        function checkValidationFailsWhenStartAndEndDatetimesMatch(elementPrefix: string) {
            const nonWorkHour = component.nonWorkHours[0];
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '08:00:00';
            nonWorkHour.end_date = nonWorkHour.start_date;
            nonWorkHour.end_time = nonWorkHour.start_time;

            const elementId = `#${elementPrefix}_${nonWorkHour.id}`;
            triggerBlurEvent(elementId);

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_END_DATETIME_MUST_BE_AFTER_START_DATETIME);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(nonWorkHour.id);
            expect(validationFailure.errorMessage).toBe(ERROR_END_DATETIME_MUST_BE_AFTER_START_DATETIME);
            assertSaveButtonIsDisabled();
        }

        function checkValidationFailsWhenDatetimesOverlap(elementPrefix: string) {
            component.nonWorkHours = [];
            const workHour1 = new EditVhoNonAvailabilityWorkHoursModel();
            workHour1.id = 1;
            workHour1.start_date = '2022-10-22';
            workHour1.start_time = '10:00:00';
            workHour1.end_date = '2022-10-24';
            workHour1.end_time = '17:00:00';
            const workHour2 = new EditVhoNonAvailabilityWorkHoursModel();
            workHour2.id = 2;
            workHour2.start_date = '2022-10-23';
            workHour2.start_time = '10:00:00';
            workHour2.end_date = '2022-10-24';
            workHour2.end_time = '17:00:00';
            component.nonWorkHours.push(workHour1);
            component.nonWorkHours.push(workHour2);
            fixture.detectChanges();

            const elementId = `#${elementPrefix}_${workHour1.id}`;
            triggerBlurEvent(elementId);

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_OVERLAPPING_DATETIMES);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === workHour1.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(workHour1.id);
            expect(validationFailure.errorMessage).toBe(ERROR_OVERLAPPING_DATETIMES);
            assertSaveButtonIsDisabled();
        }

        function checkValidationFailsWhenStartTimeIsEmpty(elementPrefix: string) {
            const nonWorkHour = component.nonWorkHours[0];
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '';
            nonWorkHour.end_date = '2022-01-01';
            nonWorkHour.end_time = '10:00:00';

            const elementId = `#${elementPrefix}_${nonWorkHour.id}`;
            triggerBlurEvent(elementId);

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_START_TIME_REQUIRED);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(nonWorkHour.id);
            expect(validationFailure.errorMessage).toBe(ERROR_START_TIME_REQUIRED);
            assertSaveButtonIsDisabled();
        }

        function checkValidationFailsWhenEndTimeIsEmpty(elementPrefix: string) {
            const nonWorkHour = component.nonWorkHours[0];
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '08:00:00';
            nonWorkHour.end_date = '2022-01-01';
            nonWorkHour.end_time = '';

            const elementId = `#${elementPrefix}_${nonWorkHour.id}`;
            triggerBlurEvent(elementId);

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_END_TIME_REQUIRED);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(nonWorkHour.id);
            expect(validationFailure.errorMessage).toBe(ERROR_END_TIME_REQUIRED);
            assertSaveButtonIsDisabled();
        }
    });

    function triggerBlurEvent(elementId: string) {
        const startDateElement = fixture.debugElement.query(By.css(elementId)).nativeElement;
        startDateElement.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
    }

    describe('date filter function', () => {
        beforeEach(() => {
            component.nonWorkHours = [
                { id: 0, start_date: '2022/10/24', end_date: '2022/10/24', start_time: '09:00:00', end_time: '23:00:00', new_row: false },
                { id: 1, start_date: '2022/10/25', end_date: '2022/10/29', start_time: '09:00:00', end_time: '23:00:00', new_row: false },
                { id: 2, start_date: '2022/10/30', end_date: '2022/10/31', start_time: '09:00:00', end_time: '23:00:00', new_row: false }
            ];
            component.nonAvailabilityWorkHoursResponses = [
                new VhoNonAvailabilityWorkHoursResponse({ id: 0, start_time: new Date('2022/10/24'), end_time: new Date('2022/10/24') }),
                new VhoNonAvailabilityWorkHoursResponse({ id: 1, start_time: new Date('2022/10/25'), end_time: new Date('2022/10/29') }),
                new VhoNonAvailabilityWorkHoursResponse({ id: 2, start_time: new Date('2022/10/30'), end_time: new Date('2022/10/31') })
            ];
            fixture.detectChanges();
        });

        it('a start date, but no end is selected, valid', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022/10/26', endDate: '' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(1);
            expect(component.nonWorkHours[0].id).toBe(1);
        });

        it('a start date, but no end is selected, invalid', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022/10/23', endDate: '' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(0);
        });

        it('a start date, and end date is selected', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022/10/26', endDate: '2022/10/30' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(2);
            expect(component.nonWorkHours[0].id).toBe(1);
            expect(component.nonWorkHours[1].id).toBe(2);
        });

        it('an end date, and a start is selected, within the rang of one workhours, but not on the specific dates', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022/10/26', endDate: '2022/10/27' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(1);
            expect(component.nonWorkHours[0].id).toBe(1);
        });

        it('an end date, and a start is selected, on the same day', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022/10/24', endDate: '2022/10/24' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(1);
        });

        it('an end date, and a start is selected, outside range', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022/11/20', endDate: '2022/11/22' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(0);
        });

        it('an end date, and a start is selected, across all range', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022/10/20', endDate: '2022/11/02' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(3);
        });
        it('it should reset the start date and end date ', () => {
            // arrange
            component.filterForm.setValue({ startDate: null, enfDate: null });
            // act
            component.resetStartDateAndEndDate();
            // assert
            expect(component.nonWorkHours.values).toBe(null);
        it('no dates selected, filter is click', () => {
            // arrange
            component.filterForm.setValue({ startDate: '', endDate: '' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(3);
        });

        it('User somehow managed to enter an end date before the start date', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022/10/31', endDate: '2022/10/29' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(3);
            expect(component.filterForm.value.startDate).toBeNull();
            expect(component.filterForm.value.endDate).toBeNull();
        });

        it('User filter table without save changes', () => {
            // arrange
            component.switchToEditMode();
            component.filterForm.setValue({ startDate: '2022/10/31', endDate: '2022/11/01' });

            component.nonWorkHours[2].start_date = '2022/10/29';
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(3);
            expect(component.showSaveConfirmation).toBe(true);
        });
    });
});
