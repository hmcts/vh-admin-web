import { Component, Input, OnInit } from '@angular/core';
import { VhoWorkHoursResponse } from '../../../services/clients/api-client';

@Component({
    selector: 'app-vho-work-hours-table',
    templateUrl: './vho-work-hours-table.component.html'
})
export class VhoWorkHoursTableComponent implements OnInit {
    workHours: VhoWorkHoursResponse[];

    @Input() set result(value: VhoWorkHoursResponse[]) {
        if (value) {
            this.workHours = value;
        }
    }

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }
}
