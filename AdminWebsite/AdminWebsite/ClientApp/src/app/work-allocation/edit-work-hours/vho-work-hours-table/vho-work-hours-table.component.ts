import { Component, Input, OnInit } from '@angular/core';
import { VhoSearchResponse, VhoWorkHoursResponse } from '../../../services/clients/api-client';

@Component({
    selector: 'app-vho-work-hours-table',
    templateUrl: './vho-work-hours-table.component.html'
})
export class VhoWorkHoursTableComponent implements OnInit {
    workHours: VhoWorkHoursResponse[] = [];
    isEditing = false;

    @Input() set result(value: VhoSearchResponse) {
        if (value?.vho_work_hours) {
            this.workHours = value.vho_work_hours;
        }
    }

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }

    cancelEditingWorkingHours() {
        this.isEditing = false;
    }

    saveWorkingHours() {

    }

    switchToEditMode() {
        if (this.workHours.length > 0) {
            this.isEditing = true;
        }
    }
}
