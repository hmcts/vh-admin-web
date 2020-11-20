import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from 'src/app/common/model/participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';

@Component({
    selector: 'app-hearing-details',
    templateUrl: 'hearing-details.component.html',
    styleUrls: ['hearing-details.component.css']
})
export class HearingDetailsComponent {
    @Input() hearing: BookingsDetailsModel = null;
    @Input() participants: Array<ParticipantDetailsModel> = [];

    //Dummy
    get phoneConferenceDetails() {
        return this.hearing.ConferencePhoneNumber &&
            this.hearing.TelephoneConferenceId &&
            this.hearing.ConferencePhoneNumber.length > 0 &&
            this.hearing.TelephoneConferenceId.length > 0
            ? `${this.hearing.ConferencePhoneNumber} (ID: ${this.hearing.TelephoneConferenceId})`
            : '';
    }

    constructor() {}

    getParticipantInfo(participantId: string): string {
        let represents = '';
        const participant = this.participants.find(p => p.ParticipantId === participantId);
        if (participant) {
            represents = participant.DisplayName + ', representing ' + participant.Representee;
        }
        return represents;
    }
}
