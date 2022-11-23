import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { BHClient, VhoWorkHoursResponse } from '../../../services/clients/api-client';
import { CanDeactiveComponent } from '../../../common/guards/changes.guard';
import { Observable } from 'rxjs';
import { VideoHearingsService } from '../../../services/video-hearings.service';

@Component({
    selector: 'app-vho-work-hours-table',
    templateUrl: './vho-work-hours-table.component.html'
})
export class VhoWorkHoursTableComponent implements CanDeactiveComponent {
    constructor(private videoHearingsService: VideoHearingsService) {}

    @Input() set result(value) {
        if (value && value[0] instanceof VhoWorkHoursResponse) {
            this.workHours = value;
        } else {
            this.workHours = null;
        }
    }

    workHours: VhoWorkHoursResponse[] = [];
    workHoursEndTimeBeforeStartTimeErrors: number[] = [];
    originalWorkHours: VhoWorkHoursResponse[] = [];
    isEditing = false;
    showSaveConfirmation = false;

    @Output() saveWorkHours: EventEmitter<VhoWorkHoursResponse[]> = new EventEmitter();

    @HostListener('window:beforeunload', ['$event'])
    canDeactive(): Observable<boolean> | boolean {
        return !this.isDataChangedAndUnsaved();
    }

    isDataChangedAndUnsaved() {
        return this.isEditing && this.workHours !== this.originalWorkHours;
    }

    cancelEditingWorkingHours() {
        this.isEditing = false;
        this.workHoursEndTimeBeforeStartTimeErrors = [];
        this.workHours = this.originalWorkHours;
        this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
    }

    saveWorkingHours() {
        this.saveWorkHours.emit(this.workHours);
        this.workHoursEndTimeBeforeStartTimeErrors = [];
        this.isEditing = false;
        this.videoHearingsService.cancelVhoNonAvailabiltiesRequest();
    }

    switchToEditMode() {
        if (this.workHours.length === 0) {
            return;
        }

        this.isEditing = true;

        this.originalWorkHours = JSON.parse(JSON.stringify(this.workHours));
    }

    validateTimes(day: VhoWorkHoursResponse) {
        if (!day.start_time || !day.end_time) {
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

        if (endDate <= startDate) {
            this.workHoursEndTimeBeforeStartTimeErrors.push(day.day_of_week_id - 1);
        } else {
            const index = this.workHoursEndTimeBeforeStartTimeErrors.findIndex(x => x === day.day_of_week_id - 1);

            if (index > -1) {
                this.workHoursEndTimeBeforeStartTimeErrors.splice(index, 1);
            }
        }
        this.registerUnsavedChanges();
    }

    handleContinue() {
        this.showSaveConfirmation = false;
    }

    registerUnsavedChanges() {
        this.videoHearingsService.setVhoNonAvailabiltiesHaveChanged(true);
    }
}
