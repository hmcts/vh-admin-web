import { Component, Input } from '@angular/core';
import { JudiciaryParticipantDetailsModel } from 'src/app/common/model/judiciary-participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';

@Component({
    selector: 'app-judicial-participant-details',
    templateUrl: './judicial-participant-details.component.html',
    styleUrls: ['./judicial-participant-details.component.scss']
})
export class JudicialParticipantDetailsComponent {
    @Input()
    participant: JudiciaryParticipantDetailsModel = null;
    @Input()
    hearing: BookingsDetailsModel;
    @Input()
    vh_officer_admin: boolean;
}
