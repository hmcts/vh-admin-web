import { Component, Input } from '@angular/core';
import { JudiciaryParticipantDetailsModel } from 'src/app/common/model/judiciary-participant-details.model';
import { VHBooking } from 'src/app/common/model/vh-booking';

@Component({
    selector: 'app-judicial-participant-details',
    templateUrl: './judicial-participant-details.component.html',
    styleUrls: ['./judicial-participant-details.component.scss']
})
export class JudicialParticipantDetailsComponent {
    @Input()
    participant: JudiciaryParticipantDetailsModel;
    @Input()
    hearing: VHBooking;
    @Input()
    vh_officer_admin: boolean;
}
