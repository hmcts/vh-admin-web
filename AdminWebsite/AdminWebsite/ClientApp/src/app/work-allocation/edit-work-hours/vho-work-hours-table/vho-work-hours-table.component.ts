import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VhoWorkHoursResponse } from '../../../services/clients/api-client';

@Component({
    selector: 'app-vho-work-hours-table',
    templateUrl: './vho-work-hours-table.component.html'
})
export class VhoWorkHoursTableComponent implements OnInit {
    workHours: VhoWorkHoursResponse[] = [];
    workHoursEndTimeBeforeStartTimeErrors: number[] = [];
    originalWorkHours: VhoWorkHoursResponse[] = [];
    isEditing = false;

    @Input() set result(value) {
        if (value && value[0] instanceof VhoWorkHoursResponse) {
            this.workHours = value;
        } else {
            this.workHours = null;
        }
    }

    @Output() saveWorkHours: EventEmitter<VhoWorkHoursResponse[]> = new EventEmitter();

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }

    cancelEditingWorkingHours() {
        this.isEditing = false;
        this.workHoursEndTimeBeforeStartTimeErrors = [];

        this.workHours = this.originalWorkHours;
    }

    saveWorkingHours() {
        this.saveWorkHours.emit(this.workHours);
        this.workHoursEndTimeBeforeStartTimeErrors = [];
        this.isEditing = false;
    }

    switchToEditMode() {
        if (this.workHours.length === 0) {
            return;
        }

        this.isEditing = true;

        this.originalWorkHours = JSON.parse(JSON.stringify(this.workHours));
    }

    validateTimes(day: VhoWorkHoursResponse) {
        console.log('Arif', day)
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
        }
        else {
            const index = this.workHoursEndTimeBeforeStartTimeErrors
                .findIndex(x => x === day.day_of_week_id - 1);
            
            if (index > -1) {
                this.workHoursEndTimeBeforeStartTimeErrors.splice(index, 1);
            }
        }
    }
}
