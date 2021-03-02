import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';

@Component({
    selector: 'app-booking-participant-details',
    templateUrl: 'participant-details.component.html',
    styleUrls: ['participant-details.component.scss']
})
export class ParticipantDetailsComponent {
    @Input()
    participant: ParticipantDetailsModel = null;

    @Input()
    vh_officer_admin: boolean;

    constructor() {}
}
