import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Logger } from 'src/app/services/logger';
import {
    BHClient,
    UploadWorkHoursRequest,
    VhoWorkHoursResponse,
    VhoNonAvailabilityWorkHoursResponse,
    WorkingHours
} from '../../services/clients/api-client';
import { VhoWorkHoursTableComponent } from './vho-work-hours-table/vho-work-hours-table.component';

@Component({
    selector: 'app-edit-work-hours',
    templateUrl: './edit-work-hours.component.html'
})
export class EditWorkHoursComponent {
    loggerPrefix = 'EditWorkHoursComponent';
    workHours: VhoWorkHoursResponse[];
    username: string;

    isUploadWorkHoursSuccessful = false;
    isUploadWorkHoursFailure = false;

    result: VhoWorkHoursResponse[] | VhoNonAvailabilityWorkHoursResponse[];

    @Input() isVhTeamLeader: boolean;

    @ViewChild(VhoWorkHoursTableComponent) vhoWorkHoursTableComponent!: VhoWorkHoursTableComponent;

    constructor(private bhClient: BHClient, private logger: Logger) {}

    onSaveWorkHours($event: VhoWorkHoursResponse[]) {
        this.workHours = $event;
        this.saveWorkHours();
    }

    saveWorkHours() {
        this.isUploadWorkHoursSuccessful = false;
        this.isUploadWorkHoursFailure = false;

        const uploadWorkHoursRequest = new UploadWorkHoursRequest();
        uploadWorkHoursRequest.working_hours = [];
        uploadWorkHoursRequest.username = this.username;

        this.workHours.forEach(editedWorkHour => {
            const workHour = new WorkingHours();
            workHour.day_of_week_id = editedWorkHour.day_of_week_id;

            const editedWorkHourEndTime = editedWorkHour.end_time?.split(':');
            const editedWorkHourStartTime = editedWorkHour.start_time?.split(':');

            if (!editedWorkHourEndTime || !editedWorkHourStartTime) {
                workHour.end_time_hour = workHour.end_time_minutes = null;
                workHour.start_time_hour = workHour.start_time_minutes = null;
            } else {
                workHour.end_time_hour = parseInt(editedWorkHourEndTime[0], 10);
                workHour.end_time_minutes = parseInt(editedWorkHourEndTime[1], 10);

                workHour.start_time_hour = parseInt(editedWorkHourStartTime[0], 10);
                workHour.start_time_minutes = parseInt(editedWorkHourStartTime[1], 10);
            }

            uploadWorkHoursRequest.working_hours.push(workHour);
        });

        this.bhClient.uploadWorkHours([uploadWorkHoursRequest]).subscribe(
            () => {
                this.isUploadWorkHoursSuccessful = true;
            },
            error => {
                this.isUploadWorkHoursFailure = true;
                this.vhoWorkHoursTableComponent.isEditing = true;
                this.logger.error(`${this.loggerPrefix} Working hours could not be saved`, error, { workHours: this.workHours });
            }
        );
    }

    setSearchResult($event: VhoWorkHoursResponse[] | VhoNonAvailabilityWorkHoursResponse[]) {
        this.result = $event;
    }

    setUsername($event: string) {
        this.username = $event;
    }
}