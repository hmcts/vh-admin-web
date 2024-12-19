import { Component, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Logger } from '../../services/logger';
import { OtherInformationModel } from '../../common/model/other-information.model';
import { ConfigService } from 'src/app/services/config.service';
import { Subject } from 'rxjs';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({
    selector: 'app-hearing-details',
    templateUrl: 'hearing-details.component.html',
    styleUrls: ['hearing-details.component.css']
})
export class HearingDetailsComponent implements OnDestroy {
    @Input() hearing: VHBooking = null;
    @Input() participants: Array<VHParticipant> = [];

    @Input() set phoneDetails(value: string) {
        this.phoneConferenceDetails = value;
    }

    phoneConferenceDetails = '';

    destroyed$ = new Subject<void>();

    constructor(private readonly route: ActivatedRoute, private readonly logger: Logger, private readonly configService: ConfigService) {}

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    getDefenceAdvocateByContactEmail(defenceAdvocateContactEmail: string): string {
        let represents = '';
        const participant = this.participants.find(p => p.email === defenceAdvocateContactEmail);
        if (participant) {
            represents = participant.display_name + ', representing ' + participant.representee;
        }
        return represents;
    }

    getOtherInformationText(): string {
        try {
            const otherInfo = OtherInformationModel.init(this.hearing?.other_information);
            return otherInfo.OtherInformation;
        } catch (e) {
            return this.hearing?.other_information;
        }
    }
}
