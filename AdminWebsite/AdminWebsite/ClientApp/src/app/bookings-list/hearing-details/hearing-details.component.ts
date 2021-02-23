import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from 'src/app/common/model/participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { ActivatedRoute } from '@angular/router';
import { Logger } from '../../services/logger';

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

    private readonly loggerPrefix = '[HearingDetails] -';
    phoneConferenceDetails = '';
    constructor(private route: ActivatedRoute, private logger: Logger) {}

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
        const datePhone = config.join_by_phone_from_date;

        if (!datePhone || datePhone.length === 0) {
            return true;
        }
        const dateFrom = this.getDateFromString(datePhone);
        if (this.hearing.ConfirmedDate) {
            return Date.parse(this.hearing.ConfirmedDate.toString()) >= Date.parse(dateFrom.toString());
        } else {
            return false;
        }
    }

    getDateFromString(datePhone: string): Date {
        const dateParts = datePhone.split('-');
        return new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
    }
}
