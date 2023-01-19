import { DatePipe } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EditVhoNonAvailabilityWorkHoursModel } from '../edit-non-work-hours-model';
import { CombineDateAndTime } from '../../../common/formatters/combine-date-and-time';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export class ValidationFailure {
    id: number;
    errorMessage: string;
}
import { BHClient, VhoNonAvailabilityWorkHoursResponse, NonWorkingHours } from '../../../services/clients/api-client';
import { faTrash, faCalendarPlus, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Logger } from '../../../services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { CanDeactiveComponent } from '../../../common/guards/changes.guard';
import { EditWorkHoursService } from '../../services/edit-work-hours.service';

@Component({
    selector: 'app-vho-work-hours-non-availability-table',
    templateUrl: './vho-work-hours-non-availability-table.component.html',
    styleUrls: ['./vho-work-hours-non-availability-table.component.css']
})
export class VhoWorkHoursNonAvailabilityTableComponent implements OnInit, CanDeactiveComponent {
    constructor(
        private datePipe: DatePipe,
        private bhClient: BHClient,
        private logger: Logger,
        private fb: FormBuilder,
        private videoHearingsService: VideoHearingsService,
        private editWorkHoursService: EditWorkHoursService
    ) {
        this.filterForm = fb.group({
            startDate: ['', Validators.required],
            endDate: ['']
        });
    }
    @Input() set result(value: VhoNonAvailabilityWorkHoursResponse[]) {
        this.resetStartDateAndEndDate();
        this.hideMessage();
        if (value) {
            this.nonAvailabilityWorkHoursResponses = value;
            this.nonWorkHours = value.map(x => this.mapNonWorkingHoursToEditModel(x));
            this.nonWorkHours = this.nonWorkHours.slice(0, this.filterSize);
            if (this.nonAvailabilityWorkHoursResponses.length > 20) {
                this.showMessage('Showing only 20 Records, For more records please use filter by date');
            } else if (this.nonAvailabilityWorkHoursResponses.length === 0) {
                this.showMessage('There are no non-availability hours uploaded for this team member');
            }
        } else {
            this.nonWorkHours = null;
        }
    }

    public static readonly ErrorStartDateRequired = 'Start date is required';
    public static readonly ErrorEndDateRequired = 'End date is required';
    public static readonly ErrorEndTimeCannotBeBeforeStartTime = 'End time cannot be before Start time';
    public static readonly ErrorEndDatetimeMustBeAfterStartDatetime = 'End datetime must be after Start datetime';
    public static readonly ErrorOverlappingDatetimes = 'You cannot enter overlapping non-availability for the same person';
    public static readonly ErrorStartTimeRequired = 'Start time is required';
    public static readonly ErrorEndTimeRequired = 'End time is required';
    private filterSize = 20;
    loggerPrefix = '[WorkHoursNonAvailabilityTable] -';
    faTrash = faTrash;
    faCalendarPlus = faCalendarPlus;
    faExclamation = faCircleExclamation;
    timeMessageDuration = 4000;

    displayConfirmPopup = false;
    slotToDelete: EditVhoNonAvailabilityWorkHoursModel;
    displayMessage = false;

    nonAvailabilityWorkHoursResponses: VhoNonAvailabilityWorkHoursResponse[];
    nonWorkHours: EditVhoNonAvailabilityWorkHoursModel[];
    originalNonWorkHours: EditVhoNonAvailabilityWorkHoursModel[];
    isEditing = false;
    isSaving = false;
    validationFailures: ValidationFailure[] = [];
    validationSummary: string[] = [];
    message: string;
    filterForm: FormGroup;

    @Input() userName: string;

    @Input() saveNonWorkHoursCompleted$: Subject<boolean>;
    @Output() saveNonWorkHours: EventEmitter<EditVhoNonAvailabilityWorkHoursModel[]> = new EventEmitter();
    @Output() editNonWorkHours: EventEmitter<void> = new EventEmitter();
    @Output() cancelSaveNonWorkHours: EventEmitter<void> = new EventEmitter();
    showSaveConfirmation = false;

    checkType(myArray: any[], type: any): boolean {
        return myArray.every(item => {
            return item instanceof type;
        });
    }

    @HostListener('window:beforeunload', ['$event'])
    canDeactive(): Observable<boolean> | boolean {
        return !this.isDataChangedAndUnsaved();
    }

    ngOnInit(): void {
        this.saveNonWorkHoursCompleted$.subscribe(success => {
            this.isSaving = false;
            if (success) {
                this.isEditing = false;
                this.originalNonWorkHours = JSON.parse(JSON.stringify(this.nonWorkHours));
                this.editWorkHoursService.fetchNonWorkHours$.next(success);
            }
        });
    }

    saveNonWorkingHours() {
        this.isSaving = true;
        this.hideMessage();

        this.saveNonWorkHours.emit(this.nonWorkHours);
        this.nonWorkHours.forEach(slot => {
            slot.new_row = false;
        });
        this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
    }

    cancelEditingNonWorkingHours() {
        this.isEditing = false;
        this.showSaveConfirmation = false;
        this.nonWorkHours = this.originalNonWorkHours;
        this.clearValidationErrors();
        this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
        this.cancelSaveNonWorkHours.emit();
    }

    switchToEditMode() {
        this.isEditing = true;

        this.originalNonWorkHours = JSON.parse(JSON.stringify(this.nonWorkHours));
        this.editNonWorkHours.emit();
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
            end_time: this.datePipe.transform(nonWorkHour.end_time, 'HH:mm:ss'),
            new_row: false
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
        this.registerUnsavedChanges();
    }

    onEndDateBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        this.validateNonWorkHour(nonWorkHour);
        this.registerUnsavedChanges();
    }

    onStartTimeBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        this.validateNonWorkHour(nonWorkHour);
        this.registerUnsavedChanges();
    }

    onEndTimeBlur(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        this.validateNonWorkHour(nonWorkHour);
        this.registerUnsavedChanges();
    }

    registerUnsavedChanges() {
        this.videoHearingsService.setVhoNonAvailabiltiesHaveChanged(true);
    }

    validateNonWorkHour(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        if (!this.validateStartDateRequired(nonWorkHour)) {
            return;
        }
        if (!this.validateEndDateRequired(nonWorkHour)) {
            return;
        }
        if (!this.validateStartTimeRequired(nonWorkHour)) {
            return;
        }
        if (!this.validateEndTimeRequired(nonWorkHour)) {
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

    validateStartTimeRequired(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const error = VhoWorkHoursNonAvailabilityTableComponent.ErrorStartTimeRequired;
        if (nonWorkHour.start_time === '') {
            this.addValidationError(nonWorkHour.id, error);
            return false;
        }
        this.removeValidationError(nonWorkHour.id, error);
        return true;
    }

    validateEndTimeRequired(nonWorkHour: EditVhoNonAvailabilityWorkHoursModel) {
        const error = VhoWorkHoursNonAvailabilityTableComponent.ErrorEndTimeRequired;
        if (nonWorkHour.end_time === '') {
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

    addNewNonAvailabilityRow() {
        this.switchToEditMode();
        const editVhoNonAvailabilityWorkHoursModel = new EditVhoNonAvailabilityWorkHoursModel();
        editVhoNonAvailabilityWorkHoursModel.end_date = new Date().toISOString().split('T')[0];
        editVhoNonAvailabilityWorkHoursModel.start_date = new Date().toISOString().split('T')[0];
        editVhoNonAvailabilityWorkHoursModel.end_time = '00:00:00';
        editVhoNonAvailabilityWorkHoursModel.start_time = '00:00:00';
        editVhoNonAvailabilityWorkHoursModel.new_row = true;

        this.nonWorkHours.push(editVhoNonAvailabilityWorkHoursModel);
        this.onStartDateBlur(editVhoNonAvailabilityWorkHoursModel);
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

    delete(slot: EditVhoNonAvailabilityWorkHoursModel) {
        this.slotToDelete = slot;
        if (slot.new_row) {
            this.removeSlot();
        } else {
            this.logger.info(`${this.loggerPrefix} Non Working hours confirmation to delete`);
            this.displayConfirmPopup = true;
        }
    }

    onDeletionAnswer($event: boolean) {
        this.displayConfirmPopup = false;
        if ($event) {
            this.bhClient.deleteNonAvailabilityWorkHours(this.slotToDelete.id).subscribe(
                res => {
                    this.logger.info(`${this.loggerPrefix} Non Working hours deleted`);
                    this.showMessage('Non-availability hours changes saved successfully');
                    this.removeSlot();
                },
                error => {
                    this.logger.error(`${this.loggerPrefix} Working hours could not be saved`, error);
                    this.showMessage('Non-availability hours changes could not be saved successfully');
                }
            );
        }
    }

    showMessage(message: string) {
        this.displayMessage = true;
        this.message = message;
    }

    private removeSlot() {
        const idx = this.nonWorkHours.indexOf(this.slotToDelete);
        this.nonWorkHours.splice(idx, 1);
    }

    isDataChangedAndUnsaved() {
        return this.isEditing && this.nonWorkHours !== this.originalNonWorkHours;
    }

    retrieveDate(date: any): Date {
        return date === '' ? null : new Date(date);
    }

    filterByDate() {
        if (!this.isDataChangedAndUnsaved()) {
            const clean = (d: Date): Date => new Date(d.toDateString()); // remove time from date
            const calenderStartDate = this.retrieveDate(this.filterForm.value.startDate);
            const calenderEndDate = this.retrieveDate(this.filterForm.value.endDate);
            let tempWorkHours = this.nonAvailabilityWorkHoursResponses;

            if (calenderStartDate && calenderEndDate) {
                if (calenderEndDate < calenderStartDate) {
                    this.filterForm.setValue({ startDate: null, endDate: null });
                    return;
                }
                tempWorkHours = tempWorkHours.filter(
                    nonWorkHours =>
                        !(
                            (clean(nonWorkHours.start_time) < calenderStartDate && clean(nonWorkHours.end_time) < calenderStartDate) ||
                            (clean(nonWorkHours.start_time) > calenderEndDate && clean(nonWorkHours.end_time) > calenderEndDate)
                        )
                );
            } else if (calenderStartDate) {
                tempWorkHours = tempWorkHours.filter(
                    nonWorkHours =>
                        clean(nonWorkHours.start_time) === calenderStartDate ||
                        (clean(nonWorkHours.start_time) <= calenderStartDate && clean(nonWorkHours.end_time) >= calenderStartDate)
                );
            }
            this.nonWorkHours = tempWorkHours.map(e => this.mapNonWorkingHoursToEditModel(e));
        } else {
            this.showSaveConfirmation = true;
        }
    }

    handleContinue() {
        this.showSaveConfirmation = false;
    }

    hideMessage() {
        this.displayMessage = false;
    }

    resetStartDateAndEndDate() {
        this.filterForm.setValue({ startDate: null, endDate: null });
    }

    get checkVhoHasWorkHours(): boolean {
        return this.nonWorkHours?.length > 0;
    }
}
