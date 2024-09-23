import { Component, Input, OnDestroy } from '@angular/core';
import { ParticipantDetailsModel } from 'src/app/common/model/participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { ActivatedRoute } from '@angular/router';
import { Logger } from '../../services/logger';
import { OtherInformationModel } from '../../common/model/other-information.model';
import { ConfigService } from 'src/app/services/config.service';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-hearing-details',
    templateUrl: 'hearing-details.component.html',
    styleUrls: ['hearing-details.component.css']
})
export class HearingDetailsComponent implements OnDestroy {
    @Input() hearing: BookingsDetailsModel = null;
    @Input() participants: Array<ParticipantDetailsModel> = [];

    @Input() set phoneDetails(value: string) {
        this.phoneConferenceDetails = value;
    }

    phoneConferenceDetails = '';

    destroyed$ = new Subject<void>();

    constructor(private route: ActivatedRoute, private logger: Logger, private configService: ConfigService) {}

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    getDefenceAdvocateByContactEmail(defenceAdvocateContactEmail: string): string {
        let represents = '';
        const participant = this.participants.find(p => p.Email === defenceAdvocateContactEmail);
        if (participant) {
            represents = participant.DisplayName + ', representing ' + participant.Representee;
        }
        return represents;
    }

    getOtherInformationText(): string {
        try {
            const otherInfo = OtherInformationModel.init(this.hearing?.OtherInformation);
            return otherInfo.OtherInformation;
        } catch (e) {
            return this.hearing?.OtherInformation;
        }
    }
}
