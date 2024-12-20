import { Component, Input } from '@angular/core';
import { OtherInformationModel } from '../../common/model/other-information.model';
import { faUserShield } from '@fortawesome/free-solid-svg-icons';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { VHBooking } from 'src/app/common/model/vh-booking';

@Component({
    selector: 'app-booking-participant-details',
    templateUrl: 'participant-details.component.html',
    styleUrls: ['participant-details.component.scss']
})
export class ParticipantDetailsComponent {
    @Input()
    participant: VHParticipant = null;
    @Input()
    hearing: VHBooking;
    @Input()
    vh_officer_admin: boolean;

    faScreeningIcon = faUserShield;

    constructor() {}

    get judgeEmail() {
        return OtherInformationModel.init(this.hearing.otherInformation).JudgeEmail;
    }

    get judgePhone() {
        return OtherInformationModel.init(this.hearing.otherInformation).JudgePhone;
    }
}
