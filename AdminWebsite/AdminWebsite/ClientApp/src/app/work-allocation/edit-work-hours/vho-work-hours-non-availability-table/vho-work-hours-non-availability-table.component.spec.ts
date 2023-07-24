import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BHClient, VhoNonAvailabilityWorkHoursResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { Logger } from '../../../services/logger';
import { ConfirmDeleteHoursPopupComponent } from '../../pop-ups/confirm-delete-popup/confirm-delete-popup.component';
import { of, throwError, Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ValidationFailure, VhoWorkHoursNonAvailabilityTableComponent } from './vho-work-hours-non-availability-table.component';
import { EditVhoNonAvailabilityWorkHoursModel } from '../edit-non-work-hours-model';
import { By } from '@angular/platform-browser';
import { FormBuilder } from '@angular/forms';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { MockWorkAllocationValues } from '../../../testing/data/work-allocation-test-data';

describe('VhoNonAvailabilityWorkHoursTableComponent', () => {
    let component: VhoWorkHoursNonAvailabilityTableComponent;
    let fixture: ComponentFixture<VhoWorkHoursNonAvailabilityTableComponent>;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    const videoServiceSpy = jasmine.createSpyObj('VideoHearingsService', [
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
        videoServiceSpy.cancelVhoNonAvailabiltiesRequest.calls.reset();
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
                component.nonWorkHours = [new EditVhoNonAvailabilityWorkHoursModel()];
                fixture.detectChanges();
                const x = component.checkVhoHasWorkHours;

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
                component.nonWorkHours = [new EditVhoNonAvailabilityWorkHoursModel()];
                fixture.detectChanges();

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
                component.nonWorkHours = [new EditVhoNonAvailabilityWorkHoursModel()];
                fixture.detectChanges();

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

        describe('saveNonWorkingHours', () => {
            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
                spyOn(component.saveNonWorkHours, 'emit');
            });
            it('should save correctly', () => {
                const nonWorkHours = {
                    id: 1,
                    start_date: '2020-01-01',
                    start_time: '00:00:00',
                    end_date: '2021-01-01',
                    end_time: '00:00:00',
                    new_row: true
                };
                component.nonWorkHours = [nonWorkHours];

                fixture.detectChanges();

                component.saveNonWorkingHours();
                fixture.detectChanges();

                expect(component.isSaving).toBe(true);
                expect(component.saveNonWorkHours.emit).toHaveBeenCalledTimes(1);
                expect(component.saveNonWorkHours.emit).toHaveBeenCalledWith(component.nonWorkHours);
                expect(videoServiceSpy.cancelVhoNonAvailabiltiesRequest).toHaveBeenCalledTimes(1);
            });
            it('should not save', () => {
                const nonWorkHours = {
                    id: 1,
                    start_date: '2020-01-01',
                    start_time: '00:00:00',
                    end_date: '2020-01-01',
                    end_time: '00:00:00',
                    new_row: true
                };
                component.nonWorkHours = [nonWorkHours];

                fixture.detectChanges();

                component.saveNonWorkingHours();
                fixture.detectChanges();

                expect(component.isSaving).toBe(false);
                expect(component.saveNonWorkHours.emit).toHaveBeenCalledTimes(0);
                expect(videoServiceSpy.cancelVhoNonAvailabiltiesRequest).toHaveBeenCalledTimes(0);
            });
            it('should save if there are no validation failures', () => {
                component.nonWorkHours = [
                    {
                        id: 1,
                        start_date: '2022-01-01',
                        start_time: '06:00',
                        end_date: '2022-01-01',
                        end_time: '08:00'
                    } as any
                ];

                component.saveNonWorkingHours();

                expect(component.isSaving).toBe(true);
                expect(component.saveNonWorkHours.emit).toHaveBeenCalledTimes(1);
                expect(component.saveNonWorkHours.emit).toHaveBeenCalledWith(component.nonWorkHours);
                expect(videoServiceSpy.cancelVhoNonAvailabiltiesRequest).toHaveBeenCalledTimes(1);
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

                component.addNewNonAvailabilityRow();
                const addedNonWorkHours = component.nonWorkHours[component.nonWorkHours.length - 1];

                expect(component.nonWorkHours.length).toBe(originalNonWorkHoursLength + 1);
                expect(addedNonWorkHours.end_date).toBe(addedNonWorkHours.start_date);
                expect(addedNonWorkHours.end_time).toBe(addedNonWorkHours.start_time);
                expect(component.isEditing).toBe(true);
            });
        });

        describe('validateRequiredField', () => {
            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('should return false and add an error when any required value is missing', () => {
                spyOn(component, 'addValidationError');
                spyOn(component, 'removeValidationError');

                component.nonWorkHours = [];
                const workHour1 = {
                    id: 1,
                    start_date: '',
                    start_time: '06:00',
                    end_date: '2022-01-01',
                    end_time: '08:00'
                } as any;
                const workHour2 = {
                    id: 1,
                    start_date: '2022-01-01',
                    start_time: '',
                    end_date: '2022-01-01',
                    end_time: '08:00'
                } as any;
                const workHour3 = {
                    id: 1,
                    start_date: '2022-01-01',
                    start_time: '06:00',
                    end_date: '',
                    end_time: '08:00'
                } as any;
                const workHour4 = {
                    id: 1,
                    start_date: '2022-01-01',
                    start_time: '06:00',
                    end_date: '2022-01-01',
                    end_time: ''
                } as any;

                const result = [
                    [workHour1, 'start_date'],
                    [workHour2, 'start_time'],
                    [workHour3, 'end_date'],
                    [workHour4, 'end_time']
                ]
                    .map(([workHour, field]) => component.validateRequiredField(workHour, field))
                    .filter(Boolean);

                expect(result.length).toBe(0);
                expect(component.addValidationError).toHaveBeenCalledTimes(4);
                expect(component.removeValidationError).toHaveBeenCalledTimes(0);
            });

            it('should return true and not add an error when no value is missing', () => {
                spyOn(component, 'addValidationError');
                spyOn(component, 'removeValidationError');

                component.nonWorkHours = [];
                const workHour1 = {
                    id: 1,
                    start_date: '2022-01-01',
                    start_time: '06:00',
                    end_date: '2022-01-01',
                    end_time: '08:00'
                } as any;

                const result = [
                    [workHour1, 'start_date'],
                    [workHour1, 'start_time'],
                    [workHour1, 'end_date'],
                    [workHour1, 'end_time']
                ]
                    .map(([workHour, field]) => component.validateRequiredField(workHour, field))
                    .filter(Boolean);

                expect(result.length).toBe(4);
                expect(component.addValidationError).toHaveBeenCalledTimes(0);
                expect(component.removeValidationError).toHaveBeenCalledTimes(4);
            });
        });

        describe('validateNonWorkHour', () => {
            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('should not call validateEndTimeBeforeStartTime if any date value is missing', () => {
                spyOn(component, 'validateEndTimeBeforeStartTime');

                component.nonWorkHours = [];
                const workHour1 = {
                    id: 1,
                    start_date: '',
                    start_time: '06:00',
                    end_date: '2022-01-01',
                    end_time: '08:00'
                } as any;

                component.validateNonWorkHour(workHour1);

                expect(component.validateEndTimeBeforeStartTime).toHaveBeenCalledTimes(0);
            });

            it('should not call validateEndDatetimeAfterStartDatetime if any date value is missing', () => {
                spyOn(component, 'validateEndDatetimeAfterStartDatetime');

                component.nonWorkHours = [];
                const workHour1 = {
                    id: 1,
                    start_date: '',
                    start_time: '06:00',
                    end_date: '2022-01-01',
                    end_time: '08:00'
                } as any;

                component.validateNonWorkHour(workHour1);

                expect(component.validateEndDatetimeAfterStartDatetime).toHaveBeenCalledTimes(0);
            });

            it('should not call validateOverlappingDates if any date value is missing', () => {
                spyOn(component, 'validateOverlappingDates');

                component.nonWorkHours = [];
                const workHour1 = {
                    id: 1,
                    start_date: '',
                    start_time: '06:00',
                    end_date: '2022-01-01',
                    end_time: '08:00'
                } as any;

                component.validateNonWorkHour(workHour1);

                expect(component.validateOverlappingDates).toHaveBeenCalledTimes(0);
            });

            it('should not call validateEndDatetimeAfterStartDatetime if end time is before start time', () => {
                spyOn(component, 'validateEndDatetimeAfterStartDatetime');

                component.nonWorkHours = [];
                const workHour1 = {
                    id: 1,
                    start_date: '2022-01-01',
                    start_time: '08:00',
                    end_date: '2022-01-01',
                    end_time: '06:00'
                } as any;

                component.validateNonWorkHour(workHour1);

                expect(component.validateEndDatetimeAfterStartDatetime).toHaveBeenCalledTimes(0);
            });

            it('should not call validateOverlappingDates if end date time is before start date time', () => {
                spyOn(component, 'validateOverlappingDates');

                component.nonWorkHours = [];
                const workHour1 = {
                    id: 1,
                    start_date: '2022-01-03',
                    start_time: '08:00',
                    end_date: '2022-01-01',
                    end_time: '06:00'
                } as any;

                component.validateNonWorkHour(workHour1);

                expect(component.validateOverlappingDates).toHaveBeenCalledTimes(0);
            });
        });

        describe('start date validation', () => {
            const elementPrefix = 'start-date';

            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('fails validation when start date is empty', () => {
                const nonWorkHour = component.nonWorkHours[0];
                nonWorkHour.start_date = '';
                fixture.detectChanges();

                component.saveNonWorkingHours();

                expect(component.validationSummary.length).toBe(1);
                expect(component.validationSummary[0]).toEqual(ERROR_START_DATE_REQUIRED);
                expect(component.validationFailures.length).toBe(1);
                const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
                expect(validationFailure).not.toEqual(null);
                expect(validationFailure.id).toBe(nonWorkHour.id);
                expect(validationFailure.errorMessage).toBe(ERROR_START_DATE_REQUIRED);
            });

            it('fails validation when end time is before start time on same day', () => {
                checkValidationFailsWhenEndTimeIsBeforeStartTime();
            });

            it('fails validation when start and end datetimes match', () => {
                checkValidationFailsWhenStartAndEndDatetimesMatch();
            });

            it('fails validation when datetimes overlap with another non work hour', () => {
                checkValidationFailsWhenDatetimesOverlap();
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

                component.saveNonWorkingHours();

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
                    component.validateNonWorkHour(workHour);
                    fixture.detectChanges();
                });

                expect(component.validationFailures.length).toBe(2);
                expect(component.validationSummary.length).toBe(1);
                expect(component.validationSummary[0]).toBe(ERROR_START_DATE_REQUIRED);
            });
        });

        describe('end date validation', () => {
            const elementPrefix = 'end-date';

            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('fails validation when end date is empty', () => {
                const nonWorkHour = component.nonWorkHours[0];
                nonWorkHour.end_date = '';

                component.saveNonWorkingHours();

                expect(component.validationSummary.length).toBe(1);
                expect(component.validationSummary[0]).toEqual(ERROR_END_DATE_REQUIRED);
                expect(component.validationFailures.length).toBe(1);
                const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
                expect(validationFailure).not.toEqual(null);
                expect(validationFailure.id).toBe(nonWorkHour.id);
                expect(validationFailure.errorMessage).toBe(ERROR_END_DATE_REQUIRED);
            });

            it('fails validation when end time is before start time on same day', () => {
                checkValidationFailsWhenEndTimeIsBeforeStartTime();
            });

            it('fails validation when start and end datetimes match', () => {
                checkValidationFailsWhenStartAndEndDatetimesMatch();
            });

            it('fails validation when datetimes overlap with another non work hour', () => {
                checkValidationFailsWhenDatetimesOverlap();
            });
        });

        describe('start time validation', () => {
            const elementPrefix = 'start-time';

            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('fails validation when end time is before start time on same day', () => {
                checkValidationFailsWhenEndTimeIsBeforeStartTime();
            });

            it('fails validation when start and end datetimes match', () => {
                checkValidationFailsWhenStartAndEndDatetimesMatch();
            });

            it('fails validation when datetimes overlap with another non work hour', () => {
                checkValidationFailsWhenDatetimesOverlap();
            });

            it('fails validation when start time is empty', () => {
                checkValidationFailsWhenStartTimeIsEmpty();
            });
        });

        describe('end time validation', () => {
            const elementPrefix = 'end-time';

            beforeEach(() => {
                component.switchToEditMode();
                fixture.detectChanges();
            });

            it('fails validation when end time is before start time on same day', () => {
                checkValidationFailsWhenEndTimeIsBeforeStartTime();
            });

            it('fails validation when start and end datetimes match', () => {
                checkValidationFailsWhenStartAndEndDatetimesMatch();
            });

            it('fails validation when datetimes overlap with another non work hour', () => {
                checkValidationFailsWhenDatetimesOverlap();
            });

            it('fails validation when end time is empty', () => {
                checkValidationFailsWhenEndTimeIsEmpty();
            });
        });

        function checkValidationFailsWhenEndTimeIsBeforeStartTime() {
            const nonWorkHour = component.nonWorkHours[0];
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '08:00:00';
            nonWorkHour.end_date = '2022-01-01';
            nonWorkHour.end_time = '06:00:00';
            fixture.detectChanges();

            component.saveNonWorkingHours();

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_END_TIME_CANNOT_BE_BEFORE_START_TIME);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(nonWorkHour.id);
            expect(validationFailure.errorMessage).toBe(ERROR_END_TIME_CANNOT_BE_BEFORE_START_TIME);
        }

        function checkValidationFailsWhenStartAndEndDatetimesMatch() {
            const nonWorkHour = component.nonWorkHours[0];
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '08:00:00';
            nonWorkHour.end_date = nonWorkHour.start_date;
            nonWorkHour.end_time = nonWorkHour.start_time;

            component.saveNonWorkingHours();

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_END_DATETIME_MUST_BE_AFTER_START_DATETIME);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(nonWorkHour.id);
            expect(validationFailure.errorMessage).toBe(ERROR_END_DATETIME_MUST_BE_AFTER_START_DATETIME);
        }

        function checkValidationFailsWhenDatetimesOverlap() {
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

            component.saveNonWorkingHours();

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_OVERLAPPING_DATETIMES);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === workHour1.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(workHour1.id);
            expect(validationFailure.errorMessage).toBe(ERROR_OVERLAPPING_DATETIMES);
        }

        function checkValidationFailsWhenStartTimeIsEmpty() {
            const nonWorkHour = component.nonWorkHours[0];
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '';
            nonWorkHour.end_date = '2022-01-01';
            nonWorkHour.end_time = '10:00:00';

            component.saveNonWorkingHours();

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_START_TIME_REQUIRED);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(nonWorkHour.id);
            expect(validationFailure.errorMessage).toBe(ERROR_START_TIME_REQUIRED);
        }

        function checkValidationFailsWhenEndTimeIsEmpty() {
            const nonWorkHour = component.nonWorkHours[0];
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '08:00:00';
            nonWorkHour.end_date = '2022-01-01';
            nonWorkHour.end_time = '';

            component.saveNonWorkingHours();

            expect(component.validationSummary.length).toBe(1);
            expect(component.validationSummary[0]).toEqual(ERROR_END_TIME_REQUIRED);
            expect(component.validationFailures.length).toBe(1);
            const validationFailure = component.validationFailures.find(x => x.id === nonWorkHour.id);
            expect(validationFailure).not.toEqual(null);
            expect(validationFailure.id).toBe(nonWorkHour.id);
            expect(validationFailure.errorMessage).toBe(ERROR_END_TIME_REQUIRED);
        }
    });

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
            component.filterForm.setValue({ startDate: '2022-10-26', endDate: '' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(1);
            expect(component.nonWorkHours[0].id).toBe(1);
        });

        it('a start date, but no end is selected, invalid', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022-10-23', endDate: '' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(0);
        });

        it('a start date, and end date is selected', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022-10-26', endDate: '2022-10-30' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(2);
            expect(component.nonWorkHours[0].id).toBe(1);
            expect(component.nonWorkHours[1].id).toBe(2);
        });

        it('an end date, and a start is selected, within the rang of one workhours, but not on the specific dates', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022-10-26', endDate: '2022-10-27' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(1);
            expect(component.nonWorkHours[0].id).toBe(1);
        });

        it('an end date, and a start is selected, on the same day with a BST date', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022-10-24', endDate: '2022-10-24' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(1);
        });

        it('an end date, and a start is selected, on the same day with a GMT date', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022-10-31', endDate: '2022-10-31' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(1);
        });

        it('an end date, and a start is selected, outside range', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022-11-20', endDate: '2022-11-22' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(0);
        });

        it('an end date, and a start is selected, across all range', () => {
            // arrange
            component.filterForm.setValue({ startDate: '2022-10-20', endDate: '2022-11-02' });
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(3);
        });
        it('should check non work hours are populated', () => {
            component.nonWorkHours = [new EditVhoNonAvailabilityWorkHoursModel()];
            expect(component.checkVhoHasWorkHours).toBe(true);
        });
        it('should check non work hours are empty', () => {
            component.nonWorkHours = null;
            expect(component.checkVhoHasWorkHours).toBe(false);
        });
        it('it should reset the start date and end date ', () => {
            // arrange
            let startD = null;
            let endD = null;
            component.filterForm.setValue({ startDate: '2022-10-20', endDate: '2022-10-20' });
            // act
            component.resetStartDateAndEndDate();
            startD = component.filterForm.value.startDate;
            endD = component.filterForm.value.startDate;
            // assert
            expect(startD).toBe(null);
            expect(endD).toBe(null);
        });
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
            component.filterForm.setValue({ startDate: '2022-10-31', endDate: '2022-10-29' });
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
            component.filterForm.setValue({ startDate: '2022-10-31', endDate: '2022-11-01' });

            component.nonWorkHours[2].start_date = '2022/10/29';
            // act
            component.filterByDate();
            // assert
            expect(component.nonWorkHours.length).toBe(3);
            expect(component.showSaveConfirmation).toBe(true);
        });

        it('User filter dates and save changes', () => {
            // arrange
            const testData = MockWorkAllocationValues.NonAvailabilityWorkHoursResponses();
            component.result = testData;
            component.switchToEditMode();
            component.filterForm.setValue({ startDate: '2023-01-01', endDate: '2023-01-05' });
            // act
            component.filterByDate();
            expect(component.nonWorkHours.length).toEqual(5);
            component.nonWorkHours[2].start_time = '09:01:00';
            component.saveNonWorkingHours();
            // assert
            expect(component.isFiltered).toBe(true);
            component.result = testData;
            expect(component.nonWorkHours.length).toEqual(5);
        });
    });

    describe('displaying messages for results', () => {
        it('should display a message when there are zero results', () => {
            // arrange
            const testData = new Array<VhoNonAvailabilityWorkHoursResponse>();
            // act
            component.result = testData;
            // assert
            expect(component.displayMessage).toBeTruthy();
            expect(component.message).toBe(VhoWorkHoursNonAvailabilityTableComponent.WarningNoWorkingHoursForVho);
        });

        it('should display a message when results length exceeds 20 after filter', () => {
            // arrange
            const testData = MockWorkAllocationValues.NonAvailabilityWorkHoursResponses();
            const startDate = new Date(2022, 1, 1);
            const endDate = new Date(2023, 4, 1);
            component.result = testData;
            component.switchToEditMode();
            component.originalNonWorkHours = component.nonWorkHours;
            component.filterForm.controls['startDate'].setValue(startDate);
            component.filterForm.controls['endDate'].setValue(endDate);
            // act
            component.filterByDate();
            // assert
            expect(component.displayMessage).toBeTruthy();
            expect(component.message).toBe(VhoWorkHoursNonAvailabilityTableComponent.WarningRecordLimitExeeded);
        });

        it('should not display a message when results are between 0 and  less than 20 after filter', () => {
            // arrange
            const testData = MockWorkAllocationValues.NonAvailabilityWorkHoursResponses();
            const startDate = new Date(2022, 1, 1);
            const endDate = new Date(2023, 1, 0);
            component.result = testData;
            component.switchToEditMode();
            component.originalNonWorkHours = component.nonWorkHours;
            component.filterForm.controls['startDate'].setValue(startDate);
            component.filterForm.controls['endDate'].setValue(endDate);
            // act
            component.filterByDate();
            // assert
            expect(component.displayMessage).toBeFalsy();
        });

        it('it should display a message when non-availability hour row deleted', () => {
            component.nonWorkHours = [new EditVhoNonAvailabilityWorkHoursModel()];
            component.addNewNonAvailabilityRow();
            const slot = component.nonWorkHours[component.nonWorkHours.length - 1];

            component.delete(slot);
            component.onDeletionAnswer(true);
            fixture.detectChanges();
            // assert
            expect(component.displayMessage).toBeTruthy();
            expect(component.message).toBe(VhoWorkHoursNonAvailabilityTableComponent.DeleteRowMessageNonAvailabilityHours);
        });
    });

    describe('handleContinue', () => {
        it('hides save confirmation', () => {
            component.showSaveConfirmation = true;
            component.handleContinue();
            expect(component.showSaveConfirmation).toBeFalsy();
        });
    });
});
