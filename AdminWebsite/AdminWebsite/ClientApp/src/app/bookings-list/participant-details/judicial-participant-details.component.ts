import { Component, Input } from '@angular/core';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { VHBooking } from 'src/app/common/model/vh-booking';

@Component({
    selector: 'app-judicial-participant-details',
    templateUrl: './judicial-participant-details.component.html',
    styleUrls: ['./judicial-participant-details.component.scss']
})
export class JudicialParticipantDetailsComponent {
    @Input()
    participant: JudicialMemberDto;
    @Input()
    hearing: VHBooking;
    @Input()
    vh_officer_admin: boolean;
}
