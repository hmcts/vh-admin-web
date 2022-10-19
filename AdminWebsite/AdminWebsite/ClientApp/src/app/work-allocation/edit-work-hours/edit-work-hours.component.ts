import { Component, Input, OnInit } from '@angular/core';
import { VhoSearchResponse } from '../../services/clients/api-client';

@Component({
    selector: 'app-edit-work-hours',
    templateUrl: './edit-work-hours.component.html',
    styleUrls: ['./edit-work-hours.component.css']
})
export class EditWorkHoursComponent implements OnInit {
    result: VhoSearchResponse;
    @Input() isVhTeamLeader: boolean;

    ngOnInit(): void {
        console.log('Needs something for sonarcloud. Delete this later');
    }

    setSearchResult($event: VhoSearchResponse) {
        this.result = $event;
    }
}
