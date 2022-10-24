import { Component, Input, OnInit } from '@angular/core';
import { BHClient, UploadWorkHoursRequest, VhoWorkHoursResponse, WorkingHours } from '../../services/clients/api-client';

@Component({
    selector: 'app-edit-work-hours',
    templateUrl: './edit-work-hours.component.html'
})
export class EditWorkHoursComponent implements OnInit {
    result: VhoWorkHoursResponse[];
    username: string;

    isUploadWorkHoursSuccessful = false;

    @Input() isVhTeamLeader: boolean;

    constructor(private bhClient: BHClient) {}

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }

    onSaveWorkHours($event: VhoWorkHoursResponse[]) {
        this.isUploadWorkHoursSuccessful = false;
        const uploadWorkHoursRequest = new UploadWorkHoursRequest();
        uploadWorkHoursRequest.working_hours = [];
        uploadWorkHoursRequest.username = this.username;

        $event.forEach(editedWorkHour => {
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

        this.bhClient.uploadWorkHours([uploadWorkHoursRequest]).subscribe(() => {
            this.isUploadWorkHoursSuccessful = true;
        });
    }

    setSearchResult($event: VhoWorkHoursResponse[]) {
        this.result = $event;
    }

    setUsername($event: string) {
        this.username = $event;
    }
}
