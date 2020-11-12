import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';

@Component({
    selector: 'app-booking-participant-list',
    templateUrl: 'booking-participant-list.component.html',
    styleUrls: ['booking-participant-list.component.css']
})
export class BookingParticipantListComponent {
    private _participants: Array<ParticipantDetailsModel> = [];

    @Input()
    set participants(participants: Array<ParticipantDetailsModel>) {
        this._participants = participants;
    }

    @Input()
    judges: Array<ParticipantDetailsModel> = [];

    @Input()
    vh_officer_admin: boolean;

    constructor() {}

    get participants(): Array<ParticipantDetailsModel> {
        // transform for display last item without bottom line.
        if (this._participants && this._participants.length > 0) {
            this._participants[this._participants.length - 1].Flag = true;
        }
        let indexItem = 0;
        this._participants.forEach(x => {
            x.IndexInList = indexItem;
            indexItem++;
        });
        return this._participants;
    }
}
