import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { OtherInformationModel } from '../../common/model/other-information.model';

@Component({
    selector: 'app-booking-participant-details',
    templateUrl: 'participant-details.component.html',
    styleUrls: ['participant-details.component.scss']
})
export class ParticipantDetailsComponent {
    @Input()
    participant: ParticipantDetailsModel = null;
    @Input()
    hearing: BookingsDetailsModel;
    @Input()
    vh_officer_admin: boolean;

    constructor() {}

    JudgeEmail() {
        return OtherInformationModel.init(this.hearing.OtherInformation).JudgeEmail;
    }

    JudgePhone() {
        return OtherInformationModel.init(this.hearing.OtherInformation).JudgePhone;
    }
}
