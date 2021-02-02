import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from 'src/app/common/model/participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-hearing-details',
    templateUrl: 'hearing-details.component.html',
    styleUrls: ['hearing-details.component.css']
})
export class HearingDetailsComponent {
    @Input() hearing: BookingsDetailsModel = null;
    @Input() participants: Array<ParticipantDetailsModel> = [];
    @Input() set phoneDetails(value: string) {
        this.phoneConferenceDetails = value;
    }

    phoneConferenceDetails = '';
    constructor(private route: ActivatedRoute) {}

    getParticipantInfo(participantId: string): string {
        let represents = '';
        const participant = this.participants.find(p => p.ParticipantId === participantId);
        if (participant) {
            represents = participant.DisplayName + ', representing ' + participant.Representee;
        }
        return represents;
    }

    isJoinByPhone(): boolean {
        const config = this.route.snapshot.data['configSettings'];
        const datePhone = config.option_on_join_by_phone_date;
        if (datePhone.length > 0 && this.hearing.ConfirmedDate) {
            return Date.parse(this.hearing.ConfirmedDate.toString()) >= Date.parse(datePhone);
        } else {
            return false;
        }
    }
}
