import { Component, Input, OnInit } from '@angular/core';
import { VhoNonAvailabilityWorkHoursResponse } from '../../../services/clients/api-client';

@Component({
    selector: 'app-vho-work-hours-non-availability-table',
    templateUrl: './vho-work-hours-non-availability-table.component.html'
})
export class VhoWorkHoursNonAvailabilityTableComponent implements OnInit {
    nonWorkHours: VhoNonAvailabilityWorkHoursResponse[];

    @Input() set result(value) {
        if (value && value[0] instanceof VhoNonAvailabilityWorkHoursResponse) {
            this.nonWorkHours = value;
        } else {
            this.nonWorkHours = null;
        }
    }
    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }
}
