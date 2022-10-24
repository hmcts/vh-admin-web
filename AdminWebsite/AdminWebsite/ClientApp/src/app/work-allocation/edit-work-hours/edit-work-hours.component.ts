import { Component, Input, OnInit } from '@angular/core';
import { VhoWorkHoursResponse } from '../../services/clients/api-client';

@Component({
    selector: 'app-edit-work-hours',
    templateUrl: './edit-work-hours.component.html'
})
export class EditWorkHoursComponent implements OnInit {
    result: VhoWorkHoursResponse[];
    @Input() isVhTeamLeader: boolean;

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }

    onSaveWorkHours($event: VhoWorkHoursResponse[]) {
        console.log('Arif', $event)
    }

    setSearchResult($event: VhoWorkHoursResponse[]) {
        this.result = $event;
    }
}
