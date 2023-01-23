import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { CanDeactiveComponent } from '../../../common/guards/changes.guard';
import { Observable } from 'rxjs';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

export class ValidationFailure {
    id: number;
    errorMessage: string;
}

@Component({
    selector: 'app-vho-work-hours-table',
    templateUrl: './vho-work-hours-table.component.html'
})
export class VhoWorkHoursTableComponent implements CanDeactiveComponent {
    constructor(private videoHearingsService: VideoHearingsService) {}

    @Input() set result(value: VhoWorkHoursResponse[]) {
        if (value) {
            this.workHours = value;
        } else {
            this.workHours = null;
        }
        this.checkVhoHasNWorkHoursToEdit();
    }
    public static readonly ErrorStartAndEndTimeBothRequired = 'Both Start Time and End Time must be filled in or empty';
    public static readonly ErrorEndTimeBeforeStartTime = 'End Time cannot be before Start Time';
    public static readonly WarningNoWorkingHoursForVho =
        "There are no working hours available to edit for this user. Please upload this user's working hours before they can be edited.";

    displayMessage = false;

    message: string;
    showSaveConfirmation = false;
    workHours: VhoWorkHoursResponse[] = [];
    validationFailures: ValidationFailure[] = [];
    validationSummary: string[] = [];
    originalWorkHours: VhoWorkHoursResponse[] = [];
    isEditing = false;

    faExclamation = faCircleExclamation;

    @Output() saveWorkHours: EventEmitter<VhoWorkHoursResponse[]> = new EventEmitter();
    @Output() editWorkHours: EventEmitter<void> = new EventEmitter();
    @Output() cancelSaveWorkHours: EventEmitter<void> = new EventEmitter();

    @HostListener('window:beforeunload', ['$event'])
    canDeactive(): Observable<boolean> | boolean {
        return !this.isDataChangedAndUnsaved();
    }

    isDataChangedAndUnsaved() {
        return this.isEditing && this.workHours !== this.originalWorkHours;
    }

    cancelEditingWorkingHours() {
        this.isEditing = false;
        this.validationFailures = [];
        this.validationSummary = [];
        this.workHours = this.originalWorkHours;
        this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
        this.cancelSaveWorkHours.emit();
    }

    saveWorkingHours() {
        this.saveWorkHours.emit(this.workHours);
        this.validationFailures = [];
        this.validationSummary = [];
        this.isEditing = false;
        this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
    }

    switchToEditMode() {
        if (this.workHours.length === 0) {
            return;
        }

        this.isEditing = true;

        this.originalWorkHours = JSON.parse(JSON.stringify(this.workHours));
        this.editWorkHours.emit();
    }

    validateTimes(day: VhoWorkHoursResponse) {
        let error = VhoWorkHoursTableComponent.ErrorStartAndEndTimeBothRequired;
        if ((day.start_time && !day.end_time) || (!day.start_time && day.end_time)) {
            this.addValidationError(day.day_of_week_id, error);
            return;
        }
        this.removeValidationError(day.day_of_week_id, error);

        if (!day.start_time && !day.end_time) {
            return;
        }

        let workHourArray = day.start_time.split(':');

        const startDate = new Date();
        startDate.setHours(parseInt(workHourArray[0], 10));
        startDate.setMinutes(parseInt(workHourArray[1], 10));

        workHourArray = day.end_time.split(':');

        const endDate = new Date();
        endDate.setHours(parseInt(workHourArray[0], 10));
        endDate.setMinutes(parseInt(workHourArray[1], 10));

        error = VhoWorkHoursTableComponent.ErrorEndTimeBeforeStartTime;
        if (endDate <= startDate) {
            this.addValidationError(day.day_of_week_id, error);
            return;
        }
        this.removeValidationError(day.day_of_week_id, error);
    }

    addValidationError(dayOfWeekId: number, error: string) {
        const existingValidationFailureIndex = this.validationFailures.findIndex(x => x.id === dayOfWeekId && x.errorMessage === error);
        const existingValidationSummaryIndex = this.validationSummary.findIndex(x => x === error);

        if (existingValidationFailureIndex === -1) {
            this.validationFailures.push({
                id: dayOfWeekId,
                errorMessage: error
            });
        }

        if (existingValidationSummaryIndex === -1) {
            this.validationSummary.push(error);
        }
    }

    removeValidationError(dayOfWeekId: number, error: string) {
        const existingValidationFailureIndex = this.validationFailures.findIndex(x => x.id === dayOfWeekId && x.errorMessage === error);
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

    workHourIsValid(dayOfWeekId: number) {
        if (this.validationFailures.some(x => x.id === dayOfWeekId)) {
            return false;
        }

        return true;
    }

    onWorkHourFieldBlur(workHour: VhoWorkHoursResponse) {
        this.validateTimes(workHour);
        this.registerUnsavedChanges();
    }

    handleContinue() {
        this.showSaveConfirmation = false;
    }

    registerUnsavedChanges() {
        this.videoHearingsService.setVhoNonAvailabiltiesHaveChanged(true);
    }

    get checkVhoHasWorkHours(): boolean {
        return this.workHours?.length > 0;
    }
    showMessage(message: string) {
        this.displayMessage = true;
        this.message = message;
    }

    checkVhoHasNWorkHoursToEdit() {
        if (this.workHours?.length <= 0) {
            this.showMessage(VhoWorkHoursTableComponent.WarningNoWorkingHoursForVho);
        }
    }
}
