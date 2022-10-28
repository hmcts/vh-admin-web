import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { NonWorkingHours, VhoNonAvailabilityWorkHoursResponse } from '../../../services/clients/api-client';
import { EditVhoNonAvailabilityWorkHoursModel } from '../edit-non-work-hours-model';

class ValidationFailure {
    id: number;
    errorMessage: string;
}

@Component({
    selector: 'app-vho-work-hours-non-availability-table',
    templateUrl: './vho-work-hours-non-availability-table.component.html'
})
export class VhoWorkHoursNonAvailabilityTableComponent implements OnInit {
    nonWorkHours: EditVhoNonAvailabilityWorkHoursModel[];
    originalNonWorkHours: EditVhoNonAvailabilityWorkHoursModel[];
    isEditing = false;
    isSaving = false;
    validationFailures: ValidationFailure[] = [];
    distinctValidationErrors: string[] = [];
    // isSaveButtonEnabled = true;
    // isCancelButtonEnabled = true;

    constructor(private datePipe: DatePipe) {}

    @Input() set result(value) {
        if (value && value[0] instanceof VhoNonAvailabilityWorkHoursResponse) {
            this.nonWorkHours = value.map(x => this.mapNonWorkingHoursToEditModel(x));
        } else {
            this.nonWorkHours = null;
        }
    }

    @Input() saveNonWorkHoursCompleted$: Subject<void>;
    //@Input() onSaveNonWorkHoursComplete:

    // @Input() onSaveComplete: () => {
    //     this.isSaveButtonEnabled = value;
    // }

    @Output() saveNonWorkHours: EventEmitter<EditVhoNonAvailabilityWorkHoursModel[]> = new EventEmitter();

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
        this.saveNonWorkHoursCompleted$.subscribe(() => {
            console.log('onSaveNonWorkHoursComplete received');
            // this.isSaveButtonEnabled = true;
            // this.isCancelButtonEnabled = true;
            this.isSaving = false;
        });
    }

    saveNonWorkingHours() {
        console.log('Saved non availabilities');
        // this.isSaveButtonEnabled = false;
        // this.isCancelButtonEnabled = false;
        this.isSaving = true;

        // if (!this.validate()) {
        //     this.isSaving = false;
        //     return;
        // }

        this.saveNonWorkHours.emit(this.nonWorkHours);
    }

    // onSaveNonWorkHoursComplete($event: void) {
    //     this.isSaveButtonEnabled = true;
    //     this.isCancelButtonEnabled = true;
    //     this.isa
    // }

    cancelEditingNonWorkingHours() {
        console.log('Cancelled editing non availabilities');
        this.isEditing = false;

        this.nonWorkHours = this.originalNonWorkHours;
        this.clearValidationErrors();
    }

    switchToEditMode() {
        this.isEditing = true;

        this.originalNonWorkHours = JSON.parse(JSON.stringify(this.nonWorkHours));
    }

    mapNonWorkingHoursToEditModel(nonWorkHour: VhoNonAvailabilityWorkHoursResponse): EditVhoNonAvailabilityWorkHoursModel {
        //this.datePipe.transform(date, 'yyyy-MM-dd');

        var hours: EditVhoNonAvailabilityWorkHoursModel = {
            id: nonWorkHour.id,
            start_date: this.datePipe.transform(nonWorkHour.start_time, 'yyyy-MM-dd'), // nonWorkHour.start_time.toLocaleString('yyyy-mm-dd'), // new Date(nonWorkHour.start_time.toDateString()),
            start_time: nonWorkHour.start_time.toLocaleTimeString(),
            end_date: this.datePipe.transform(nonWorkHour.end_time, 'yyyy-MM-dd'), // nonWorkHour.end_time.toLocaleString('yyyy-mm-dd'),
            end_time: nonWorkHour.end_time.toLocaleTimeString()
        };
        return hours;
    }

    validate() {
        this.clearValidationErrors();

        this.nonWorkHours.forEach(nonWorkHour => {
            if (nonWorkHour.start_date == '') {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'Start date is required'
                });
            }
        });

        if (this.validationFailures.length > 0) {
            this.distinctValidationErrors.push('Start date is required');
            return false;
        }

        this.nonWorkHours.forEach(nonWorkHour => {
            if (nonWorkHour.end_date == '') {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End date is required'
                });
            }
        });

        if (this.validationFailures.length > 0) {
            this.distinctValidationErrors.push('End date is required');
            return false;
        }

        this.nonWorkHours.forEach(nonWorkHour => {
            if (nonWorkHour.end_time <= nonWorkHour.start_time) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End time must be after Start time'
                });
            }
        });

        if (this.validationFailures.length > 0) {
            this.distinctValidationErrors.push('End time must be after Start time');
            return false;
        }

        let firstHour: NonWorkingHours = null;
        let checkedHours: NonWorkingHours[] = [];

        let nonWorkHoursRequestModels: NonWorkingHours[] = [];
        nonWorkHoursRequestModels = this.nonWorkHours.map(
            x =>
                new NonWorkingHours({
                    id: x.id,
                    start_time: this.combineDateAndTime(x.start_date, x.start_time),
                    end_time: this.combineDateAndTime(x.end_date, x.end_time)
                })
        );
        nonWorkHoursRequestModels = nonWorkHoursRequestModels.sort((a, b) =>
            a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0
        );

        nonWorkHoursRequestModels.forEach(nonWorkHour => {
            if (firstHour !== null) {
                checkedHours.push(firstHour);
                const uncheckedHours = nonWorkHoursRequestModels.filter(
                    x => x.start_time >= firstHour.start_time && x !== firstHour && checkedHours.every(m => m != x)
                );

                if (uncheckedHours.some(uncheckedHour => this.overlapsWith(firstHour, uncheckedHour))) {
                    this.validationFailures.push({
                        //id: nonWorkHour.id,
                        id: firstHour.id,
                        errorMessage: 'You cannot enter overlapping non-availability for the same person'
                    });
                }
            }
            firstHour = nonWorkHour;
        });

        if (this.validationFailures.length > 0) {
            this.distinctValidationErrors.push('You cannot enter overlapping non-availability for the same person');
            return false;
        }

        return true;
    }

    overlapsWith(first: NonWorkingHours, second: NonWorkingHours) {
        const firstEndDateTime = first.end_time;
        const secondStartDateTime = second.start_time;

        return firstEndDateTime > secondStartDateTime;
    }

    nonWorkHourIsValid(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        if (this.validationFailures.some(x => x.id === nonWorkHour.id)) {
            return false;
        }

        return true;
    }

    clearValidationErrors() {
        this.validationFailures = [];
        this.distinctValidationErrors = [];
    }

    combineDateAndTime(date: string, time: string) {
        const dateParts = date.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const timeParts = time.split(':');
        const hour = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = 0;
        const milliseconds = 0;

        var datetime = new Date(year, month, day, hour, minutes, seconds, milliseconds);
        return datetime;
    }

    onStartDateBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const startDateTime = this.combineDateAndTime(nonWorkHour.start_date, nonWorkHour.start_time);
        const endDateTime = this.combineDateAndTime(nonWorkHour.end_date, nonWorkHour.end_time);

        var existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End time cannot be before Start time'
        );
        var existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'End time cannot be before Start time'
        );

        if (endDateTime < startDateTime) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End time cannot be before Start time'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End time cannot be before Start time');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End time cannot be before Start time')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }

        existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End datetime must be after Start datetime'
        );
        existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'End datetime must be after Start datetime'
        );

        if (endDateTime.toISOString() == startDateTime.toISOString()) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End datetime must be after Start datetime'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End datetime must be after Start datetime');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End datetime must be after Start datetime')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }

        // Start date required
        existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'Start date is required'
        );
        existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(x => x == 'Start date is required');

        if (nonWorkHour.start_date == '') {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'Start date is required'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('Start date is required');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'Start date is required')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }

        // Overlapping dates
        existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'You cannot enter overlapping non-availability for the same person'
        );
        existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'You cannot enter overlapping non-availability for the same person'
        );
        var overlappingDateFailures = this.checkOverlappingDates();
        if (overlappingDateFailures.find(x => x.id == nonWorkHour.id)) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'You cannot enter overlapping non-availability for the same person'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('You cannot enter overlapping non-availability for the same person');
            }
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'You cannot enter overlapping non-availability for the same person')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }
    }

    onEndDateBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const startDateTime = this.combineDateAndTime(nonWorkHour.start_date, nonWorkHour.start_time);
        const endDateTime = this.combineDateAndTime(nonWorkHour.end_date, nonWorkHour.end_time);

        var existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End time cannot be before Start time'
        );
        var existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'End time cannot be before Start time'
        );

        if (endDateTime < startDateTime) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End time cannot be before Start time'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End time cannot be before Start time');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End time cannot be before Start time')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }

        existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End datetime must be after Start datetime'
        );
        existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'End datetime must be after Start datetime'
        );

        if (endDateTime.toISOString() == startDateTime.toISOString()) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End datetime must be after Start datetime'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End datetime must be after Start datetime');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End datetime must be after Start datetime')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }

        existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End date is required'
        );
        existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(x => x == 'End date is required');

        if (nonWorkHour.end_date == '') {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End date is required'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End date is required');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End date is required')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }

        // Overlapping dates
        existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'You cannot enter overlapping non-availability for the same person'
        );
        existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'You cannot enter overlapping non-availability for the same person'
        );
        var overlappingDateFailures = this.checkOverlappingDates();
        if (overlappingDateFailures.find(x => x.id == nonWorkHour.id)) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'You cannot enter overlapping non-availability for the same person'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('You cannot enter overlapping non-availability for the same person');
            }
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'You cannot enter overlapping non-availability for the same person')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }
    }

    onStartTimeBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const startDateTime = this.combineDateAndTime(nonWorkHour.start_date, nonWorkHour.start_time);
        const endDateTime = this.combineDateAndTime(nonWorkHour.end_date, nonWorkHour.end_time);

        var existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End time cannot be before Start time'
        );
        var existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'End time cannot be before Start time'
        );

        if (endDateTime < startDateTime) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End time cannot be before Start time'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End time cannot be before Start time');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End time cannot be before Start time')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }

        existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End datetime must be after Start datetime'
        );
        existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'End datetime must be after Start datetime'
        );

        if (endDateTime.toISOString() == startDateTime.toISOString()) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End datetime must be after Start datetime'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End datetime must be after Start datetime');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End datetime must be after Start datetime')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }
    }

    onEndTimeBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const startDateTime = this.combineDateAndTime(nonWorkHour.start_date, nonWorkHour.start_time);
        const endDateTime = this.combineDateAndTime(nonWorkHour.end_date, nonWorkHour.end_time);

        var existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End time cannot be before Start time'
        );
        var existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'End time cannot be before Start time'
        );

        if (endDateTime < startDateTime) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End time cannot be before Start time'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End time cannot be before Start time');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End time cannot be before Start time')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }

        existingValidationFailureIndex = this.validationFailures.findIndex(
            x => x.id == nonWorkHour.id && x.errorMessage == 'End datetime must be after Start datetime'
        );
        existingDistinctValidationFailureIndex = this.distinctValidationErrors.findIndex(
            x => x == 'End datetime must be after Start datetime'
        );

        if (endDateTime.toISOString() == startDateTime.toISOString()) {
            if (existingValidationFailureIndex == -1) {
                this.validationFailures.push({
                    id: nonWorkHour.id,
                    errorMessage: 'End datetime must be after Start datetime'
                });
            }

            if (existingDistinctValidationFailureIndex == -1) {
                this.distinctValidationErrors.push('End datetime must be after Start datetime');
            }

            return;
        }

        if (existingValidationFailureIndex !== -1) {
            this.validationFailures.splice(existingValidationFailureIndex, 1);
        }

        if (existingDistinctValidationFailureIndex !== -1) {
            if (!this.validationFailures.some(x => x.errorMessage == 'End datetime must be after Start datetime')) {
                this.distinctValidationErrors.splice(existingDistinctValidationFailureIndex, 1);
            }
        }
    }

    checkOverlappingDates() {
        let firstHour: NonWorkingHours = null;
        let checkedHours: NonWorkingHours[] = [];
        let validationFailures: ValidationFailure[] = [];

        let nonWorkHoursRequestModels: NonWorkingHours[] = [];
        nonWorkHoursRequestModels = this.nonWorkHours.map(
            x =>
                new NonWorkingHours({
                    id: x.id,
                    start_time: this.combineDateAndTime(x.start_date, x.start_time),
                    end_time: this.combineDateAndTime(x.end_date, x.end_time)
                })
        );
        nonWorkHoursRequestModels = nonWorkHoursRequestModels.sort((a, b) =>
            a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0
        );

        nonWorkHoursRequestModels.forEach(nonWorkHour => {
            if (firstHour !== null) {
                checkedHours.push(firstHour);
                const uncheckedHours = nonWorkHoursRequestModels.filter(
                    x => x.start_time >= firstHour.start_time && x !== firstHour && checkedHours.every(m => m != x)
                );

                if (uncheckedHours.some(uncheckedHour => this.overlapsWith(firstHour, uncheckedHour))) {
                    validationFailures.push({
                        //id: nonWorkHour.id,
                        id: firstHour.id,
                        errorMessage: 'You cannot enter overlapping non-availability for the same person'
                    });
                }
            }
            firstHour = nonWorkHour;
        });

        return validationFailures;
    }
}
