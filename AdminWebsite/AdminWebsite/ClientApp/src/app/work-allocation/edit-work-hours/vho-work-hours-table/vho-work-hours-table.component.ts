import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UploadWorkHoursRequest, VhoSearchResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';

@Component({
    selector: 'app-vho-work-hours-table',
    templateUrl: './vho-work-hours-table.component.html'
})
export class VhoWorkHoursTableComponent implements OnInit {
    workHours: VhoWorkHoursResponse[] = [];
    workHoursEndTimeBeforeStartTimeErrors: number[] = [];
    originalWorkHours: VhoWorkHoursResponse[] = [];
    isEditing = false;

    @Input() set result(value: VhoWorkHoursResponse[]) {
        if (value) {
            this.workHours = value;
        }
    }

    @Output() saveWorkHours: EventEmitter<VhoWorkHoursResponse[]> = new EventEmitter();

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }

    cancelEditingWorkingHours() {
        this.isEditing = false;

        this.workHours = this.originalWorkHours;
    }

    saveWorkingHours() {
        this.workHours.forEach((workHour, index) => {
            if (!workHour.start_time || !workHour.end_time) {
                return;
            }

            let workHourArray = workHour.start_time.split(':');

            const startDate = new Date();
            startDate.setHours(parseInt(workHourArray[0]));
            startDate.setMinutes(parseInt(workHourArray[1]));

            workHourArray = workHour.end_time.split(':');

            const endDate = new Date();
            endDate.setHours(parseInt(workHourArray[0]));
            endDate.setMinutes(parseInt(workHourArray[1]));

            if (endDate < startDate) {
                this.workHoursEndTimeBeforeStartTimeErrors.push(index);
            }
        });

        if (this.workHoursEndTimeBeforeStartTimeErrors.length > 0) {
            return;
        }

        this.saveWorkHours.emit(this.workHours);
    }

    switchToEditMode() {
        if (this.workHours.length === 0) {
            return;
        }

        this.isEditing = true;

        this.originalWorkHours =
            JSON.parse(JSON.stringify(this.workHours));
    }
}
