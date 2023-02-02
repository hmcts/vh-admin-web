import { Component, Input, OnInit } from '@angular/core';
import { ParticipantDetailsModel } from 'src/app/common/model/participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { ActivatedRoute } from '@angular/router';
import { Logger } from '../../services/logger';
import { OtherInformationModel } from '../../common/model/other-information.model';
import { ConfigService } from 'src/app/services/config.service';
import { Subscription } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../../services/launch-darkly.service';

@Component({
    selector: 'app-hearing-details',
    templateUrl: 'hearing-details.component.html',
    styleUrls: ['hearing-details.component.css']
})
export class HearingDetailsComponent implements OnInit {
    @Input() hearing: BookingsDetailsModel = null;
    @Input() participants: Array<ParticipantDetailsModel> = [];

    @Input() set phoneDetails(value: string) {
        this.phoneConferenceDetails = value;
    }

    private readonly loggerPrefix = '[HearingDetails] -';
    phoneConferenceDetails = '';

    vhoWorkAllocationFeature = false;
    $subcription: Subscription;

    $ldSubcription: Subscription;
    enableSearchFeature: boolean;
    ejudFeatureFlag: boolean;

    constructor(
        private route: ActivatedRoute,
        private logger: Logger,
        private configService: ConfigService,
        private lanchDarklyService: LaunchDarklyService
    ) {}

    ngOnInit() {
        this.$ldSubcription = this.lanchDarklyService.flagChange.subscribe(value => {
            this.vhoWorkAllocationFeature = value[FeatureFlags.vhoWorkAllocation];
        });
    }

    getParticipantInfo(participantId: string): string {
        let represents = '';
        const participant = this.participants.find(p => p.ParticipantId === participantId);
        if (participant) {
            represents = participant.DisplayName + ', representing ' + participant.Representee;
        }
        return represents;
    }

    isJoinByPhone(): boolean {
        const config = this.configService.getConfig();
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

    getOtherInformationText(): string {
        try {
            const otherInfo = OtherInformationModel.init(this.hearing?.OtherInformation);
            return otherInfo.OtherInformation;
        } catch (e) {
            return this.hearing?.OtherInformation;
        }
    }
}
