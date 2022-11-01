import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { NonWorkingHours, VhoNonAvailabilityWorkHoursResponse } from '../../../services/clients/api-client';
import { EditVhoNonAvailabilityWorkHoursModel } from '../edit-non-work-hours-model';
import { CombineDateAndTime } from '../../../common/formatters/combine-date-and-time';

export class ValidationFailure {
    id: number;
    errorMessage: string;
}

@Component({
    selector: 'app-vho-work-hours-non-availability-table',
    templateUrl: './vho-work-hours-non-availability-table.component.html'
})
export class VhoWorkHoursNonAvailabilityTableComponent implements OnInit {
    public static readonly ErrorStartDateRequired = 'Start date is required';
    public static readonly ErrorEndDateRequired = 'End date is required';
    public static readonly ErrorEndTimeCannotBeBeforeStartTime = 'End time cannot be before Start time';
    public static readonly ErrorEndDatetimeMustBeAfterStartDatetime = 'End datetime must be after Start datetime';
    public static readonly ErrorOverlappingDatetimes = 'You cannot enter overlapping non-availability for the same person';

    nonWorkHours: EditVhoNonAvailabilityWorkHoursModel[];
    originalNonWorkHours: EditVhoNonAvailabilityWorkHoursModel[];
    isEditing = false;
    isSaving = false;
    validationFailures: ValidationFailure[] = [];
    validationSummary: string[] = [];

    constructor(private datePipe: DatePipe) {}

    @Input() set result(value) {
        if (value && value[0] instanceof VhoNonAvailabilityWorkHoursResponse) {
            this.nonWorkHours = value.map(x => this.mapNonWorkingHoursToEditModel(x));
        } else {
            this.nonWorkHours = null;
        }
    }

    @Input() saveNonWorkHoursCompleted$: Subject<boolean>;
    @Output() saveNonWorkHours: EventEmitter<EditVhoNonAvailabilityWorkHoursModel[]> = new EventEmitter();

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
        this.saveNonWorkHoursCompleted$.subscribe(success => {
            this.isSaving = false;
            if (success) {
                this.isEditing = false;
                this.originalNonWorkHours = JSON.parse(JSON.stringify(this.nonWorkHours));
            }
        });
    }

    saveNonWorkingHours() {
        this.isSaving = true;

        this.saveNonWorkHours.emit(this.nonWorkHours);
    }

    cancelEditingNonWorkingHours() {
        this.isEditing = false;

        this.nonWorkHours = this.originalNonWorkHours;
        this.clearValidationErrors();
    }

    switchToEditMode() {
        this.isEditing = true;

        this.originalNonWorkHours = JSON.parse(JSON.stringify(this.nonWorkHours));
    }

    mapNonWorkingHoursToEditModel(nonWorkHour: VhoNonAvailabilityWorkHoursResponse): EditVhoNonAvailabilityWorkHoursModel {
        if (nonWorkHour.id == null || undefined) {
            return new EditVhoNonAvailabilityWorkHoursModel();
        }

        const hours: EditVhoNonAvailabilityWorkHoursModel = {
            id: nonWorkHour.id,
            start_date: this.datePipe.transform(nonWorkHour.start_time, 'yyyy-MM-dd'),
            start_time: this.datePipe.transform(nonWorkHour.start_time, 'HH:mm:ss'),
            end_date: this.datePipe.transform(nonWorkHour.end_time, 'yyyy-MM-dd'),
            end_time: this.datePipe.transform(nonWorkHour.end_time, 'HH:mm:ss')
        };
        return hours;
    }

    nonWorkHourIsValid(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        if (this.validationFailures.some(x => x.id === nonWorkHour.id)) {
            return false;
        }

        return true;
    }

    clearValidationErrors() {
        this.validationFailures = [];
        this.validationSummary = [];
    }

    combineDateAndTime(date: string, time: string) {
        return CombineDateAndTime(date, time);
    }

    onStartDateBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        this.validateNonWorkHour(nonWorkHour);
    }

    onEndDateBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        this.validateNonWorkHour(nonWorkHour);
    }

    onStartTimeBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        this.validateNonWorkHour(nonWorkHour);
    }

    onEndTimeBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        this.validateNonWorkHour(nonWorkHour);
    }

    validateNonWorkHour(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        if (!this.validateStartDateRequired(nonWorkHour)) {
            return;
        }
        if (!this.validateEndDateRequired(nonWorkHour)) {
            return;
        }
        if (!this.validateEndTimeBeforeStartTime(nonWorkHour)) {
            return;
        }
        if (!this.validateEndDatetimeAfterStartDatetime(nonWorkHour)) {
            return;
        }
        if (!this.validateOverlappingDates()) {
            return;
        }
    }

    validateStartDateRequired(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const error = VhoWorkHoursNonAvailabilityTableComponent.ErrorStartDateRequired;
        if (nonWorkHour.start_date === '') {
            this.addValidationError(nonWorkHour.id, error);
            return false;
        }
        this.removeValidationError(nonWorkHour.id, error);
        return true;
    }

    validateEndDateRequired(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const error = VhoWorkHoursNonAvailabilityTableComponent.ErrorEndDateRequired;
        if (nonWorkHour.end_date === '') {
            this.addValidationError(nonWorkHour.id, error);
            return false;
        }
        this.removeValidationError(nonWorkHour.id, error);
        return true;
    }

    validateEndTimeBeforeStartTime(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const error = VhoWorkHoursNonAvailabilityTableComponent.ErrorEndTimeCannotBeBeforeStartTime;
        const startDateTime = this.combineDateAndTime(nonWorkHour.start_date, nonWorkHour.start_time);
        const endDateTime = this.combineDateAndTime(nonWorkHour.end_date, nonWorkHour.end_time);
        if (endDateTime < startDateTime) {
            this.addValidationError(nonWorkHour.id, error);
            return false;
        }
        this.removeValidationError(nonWorkHour.id, error);
        return true;
    }

    validateEndDatetimeAfterStartDatetime(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const error = VhoWorkHoursNonAvailabilityTableComponent.ErrorEndDatetimeMustBeAfterStartDatetime;
        const startDateTime = this.combineDateAndTime(nonWorkHour.start_date, nonWorkHour.start_time);
        const endDateTime = this.combineDateAndTime(nonWorkHour.end_date, nonWorkHour.end_time);
        if (endDateTime.toISOString() === startDateTime.toISOString()) {
            this.addValidationError(nonWorkHour.id, error);
            return false;
        }
        this.removeValidationError(nonWorkHour.id, error);
        return true;
    }

    validateOverlappingDates() {
        const error = VhoWorkHoursNonAvailabilityTableComponent.ErrorOverlappingDatetimes;
        const overlappingDateFailures = this.checkOverlappingDates();
        overlappingDateFailures.forEach(failure => {
            this.addValidationError(failure.id, error);
        });
        if (overlappingDateFailures.length > 0) {
            return false;
        }
        const existingValidationFailures = this.validationFailures.filter(x => x.errorMessage === error);
        existingValidationFailures.forEach(failure => {
            this.removeValidationError(failure.id, error);
        });
        return true;
    }

    checkOverlappingDates() {
        let firstHour: NonWorkingHours = null;
        const checkedHours: NonWorkingHours[] = [];
        const validationFailures: ValidationFailure[] = [];

        let nonWorkHoursRequestModels: NonWorkingHours[] = [];
        nonWorkHoursRequestModels = this.nonWorkHours.map(
            x =>
                new NonWorkingHours({
                    id: x.id,
                    start_time: this.combineDateAndTime(x.start_date, x.start_time),
                    end_time: this.combineDateAndTime(x.end_date, x.end_time)
                })
        );
        nonWorkHoursRequestModels = nonWorkHoursRequestModels.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());

        nonWorkHoursRequestModels.forEach(nonWorkHour => {
            if (firstHour !== null) {
                checkedHours.push(firstHour);
                const uncheckedHours = nonWorkHoursRequestModels.filter(
                    x => x.start_time >= firstHour.start_time && x !== firstHour && checkedHours.every(m => m !== x)
                );

                if (uncheckedHours.some(uncheckedHour => this.overlapsWith(firstHour, uncheckedHour))) {
                    validationFailures.push({
                        id: firstHour.id,
                        errorMessage: VhoWorkHoursNonAvailabilityTableComponent.ErrorOverlappingDatetimes
                    });
                }
            }
            firstHour = nonWorkHour;
        });

        return validationFailures;
    }

    overlapsWith(first: NonWorkingHours, second: NonWorkingHours) {
        const firstEndDateTime = first.end_time;
        const secondStartDateTime = second.start_time;

        return firstEndDateTime > secondStartDateTime;
    }

    addValidationError(nonWorkHourId: number, error: string) {
        const existingValidationFailureIndex = this.validationFailures.findIndex(x => x.id === nonWorkHourId && x.errorMessage === error);
        const existingValidationSummaryIndex = this.validationSummary.findIndex(x => x === error);

        if (existingValidationFailureIndex === -1) {
            this.validationFailures.push({
                id: nonWorkHourId,
                errorMessage: error
            });
        }

        if (existingValidationSummaryIndex === -1) {
            this.validationSummary.push(error);
        }
    }

    removeValidationError(nonWorkHourId: number, error: string) {
        const existingValidationFailureIndex = this.validationFailures.findIndex(x => x.id === nonWorkHourId && x.errorMessage === error);
        const existingValidationSummaryIndex = this.validationSummary.findIndex(x => x === error);

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingValidationSummaryIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage === error)) {
                this.validationSummary.splice(existingValidationSummaryIndex, 1);
            }
        }
    }
}
