import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { VhoWorkHoursNonAvailabilityTableComponent } from './vho-work-hours-non-availability-table.component';
import { BHClient, VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { Logger } from '../../../services/logger';
import { ConfirmDeleteHoursPopupComponent } from '../../../popups/confirm-delete-popup/confirm-delete-popup.component';
import { HttpTestingController } from '@angular/common/http/testing';
import { Observable, of, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationFailure, VhoWorkHoursNonAvailabilityTableComponent } from './vho-work-hours-non-availability-table.component';
import { VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { EditVhoNonAvailabilityWorkHoursModel } from '../edit-non-work-hours-model';
import { Subject } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('VhoNonAvailabilityWorkHoursTableComponent', () => {
    let component: VhoWorkHoursNonAvailabilityTableComponent;
    let fixture: ComponentFixture<VhoWorkHoursNonAvailabilityTableComponent>;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(async () => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['deleteNonAvailabilityWorkHours']);
        bHClientSpy.deleteNonAvailabilityWorkHours.and.returnValue(of({ value: 0 }));
        loggerSpy = jasmine.createSpyObj('Logger', ['info', 'error']);
        await TestBed.configureTestingModule({
            providers: [
                { provide: Logger, useValue: loggerSpy },
                { provide: BHClient, useValue: bHClientSpy }
            ],
            declarations: [VhoWorkHoursNonAvailabilityTableComponent, ConfirmDeleteHoursPopupComponent]
            providers: [DatePipe]
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
            end_time: new Date(),
            start_time: new Date()
        });
        component.result = [slot];
        fixture.detectChanges();
        expect(component.nonWorkHours).toEqual([slot]);
    });

    it('check the slot is not removed if confirmation is popup is false', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            end_time: new Date(),
            start_time: new Date()
        });
        component.result = [slot];
        component.delete(slot);
        component.onDeletionAnswer(false);
        fixture.detectChanges();
        expect(component.nonWorkHours).toEqual([slot]);
        expect(bHClientSpy.deleteNonAvailabilityWorkHours).toHaveBeenCalledTimes(0);
        expect(component.displayConfirmPopup).toBeFalsy();
        expect(component.nonWorkHours).toEqual([new EditVhoNonAvailabilityWorkHoursModel()]);
    });

    it('check results input parameter with populated values sets the value', () => {
        const nonWorkHours: VhoNonAvailabilityWorkHoursResponse[] = [];
        nonWorkHours.push(
            new VhoNonAvailabilityWorkHoursResponse({
                id: 1,
                start_time: new Date(2022, 1, 1, 6, 0, 0),
                end_time: new Date(2022, 1, 1, 8, 0, 0)
            })
        );
        nonWorkHours.push(
            new VhoNonAvailabilityWorkHoursResponse({
                id: 2,
                start_time: new Date(2022, 2, 3, 18, 0, 0),
                end_time: new Date(2022, 2, 3, 20, 0, 0)
            })
        );
        component.result = nonWorkHours;
        fixture.detectChanges();
        const mappedWorkHours: EditVhoNonAvailabilityWorkHoursModel[] = [];
        const mappedWorkHours1 = new EditVhoNonAvailabilityWorkHoursModel();
        mappedWorkHours1.id = 1;
        mappedWorkHours1.start_date = '2022-02-01';
        mappedWorkHours1.start_time = '06:00:00';
        mappedWorkHours1.end_date = '2022-02-01';
        mappedWorkHours1.end_time = '08:00:00';
        const mappedWorkHours2 = new EditVhoNonAvailabilityWorkHoursModel();
        mappedWorkHours2.id = 2;
        mappedWorkHours2.start_date = '2022-03-03';
        mappedWorkHours2.start_time = '18:00:00';
        mappedWorkHours2.end_date = '2022-03-03';
        mappedWorkHours2.end_time = '20:00:00';
        mappedWorkHours.push(mappedWorkHours1);
        mappedWorkHours.push(mappedWorkHours2);
        expect(JSON.stringify(component.nonWorkHours)).toEqual(JSON.stringify(mappedWorkHours));
    });

    it('check results input parameter sets to null', () => {
        component.result = null;
        fixture.detectChanges();
        expect(component.nonWorkHours).toBeNull();
    });

    it('check results input parameter, when wrong type sets to null', () => {
        component.result = [new VhoWorkHoursResponse()];
        fixture.detectChanges();
        expect(component.nonWorkHours).toBeNull();
    });

    it('check remove slot from result when confirm deletion', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            end_time: new Date(),
            start_time: new Date()
        });
        component.result = [slot];
        component.delete(slot);
        component.onDeletionAnswer(true);
        fixture.detectChanges();

        expect(component.nonWorkHours.length).toEqual(0);
        expect(component.displayConfirmPopup).toBeFalsy();
    });

    it('check slot not removed from result when confirm deletion but error in api', () => {
        const slot = new VhoNonAvailabilityWorkHoursResponse({
            id: 1,
            end_time: new Date(),
            start_time: new Date()
        });
        bHClientSpy.deleteNonAvailabilityWorkHours.and.returnValue(throwError({ status: 500 }));
        component.result = [slot];
        component.delete(slot);
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

        beforeEach(() => {
            const nonWorkHours: VhoNonAvailabilityWorkHoursResponse[] = [];
            nonWorkHours.push(
                new VhoNonAvailabilityWorkHoursResponse({
                    id: 1,
                    start_time: new Date(2022, 0, 1, 8, 0, 0),
                    end_time: new Date(2022, 0, 1, 10, 0, 0)
                })
            );
            component.result = nonWorkHours;
            component.isEditing = false;
            component.ngOnInit();
            fixture.detectChanges();
        });

        describe('edit button clicked', () => {
            it('should switch to edit mode', () => {
                const editButton = fixture.debugElement.query(By.css('#edit-individual-non-work-hours-button')).nativeElement;
                editButton.click();
                fixture.detectChanges();

                expect(component.isEditing).toBe(true);
                expect(JSON.stringify(component.originalNonWorkHours)).toEqual(JSON.stringify(component.nonWorkHours));
            });
        });

        describe('cancel button clicked', () => {
            it('should switch to read mode', () => {
                component.switchToEditMode();
                fixture.detectChanges();

                const cancelButton = fixture.debugElement.query(By.css('#cancel-editing-individual-non-work-hours-button')).nativeElement;
                cancelButton.click();
                fixture.detectChanges();

                expect(component.isEditing).toBe(false);
                expect(JSON.stringify(component.nonWorkHours)).toEqual(JSON.stringify(component.originalNonWorkHours));
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
    });

    function triggerBlurEvent(elementId: string) {
        const startDateElement = fixture.debugElement.query(By.css(elementId)).nativeElement;
        startDateElement.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
    }
});
