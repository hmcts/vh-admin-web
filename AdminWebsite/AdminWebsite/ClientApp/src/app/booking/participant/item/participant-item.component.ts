import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { OtherInformationModel } from '../../../common/model/other-information.model';
import { HearingModel } from '../../../common/model/hearing.model';

@Component({
    selector: 'app-participant-item',
    templateUrl: './participant-item.component.html',
    styleUrls: ['./participant-item.component.scss']
})
export class ParticipantItemComponent {
    private readonly loggerPrefix = '[ParticipantList - Item] -';

    @Input() participant: ParticipantModel;
    @Input() hearing: HearingModel;
    @Input() canEdit = false;
    @Input() isSummaryPage = false;

    @Output() edit = new EventEmitter<ParticipantModel>();
    @Output() remove = new EventEmitter<ParticipantModel>();

    constructor(private bookingService: BookingService, private logger: Logger, private router: Router) {}

    getJudgeEmail(participant: ParticipantModel): string {
        const otherInformation = OtherInformationModel.init(this.hearing.other_information);
        return otherInformation.judgeEmail ?? participant.email;
    }

    getJudgePhone(participant: ParticipantModel): string {
        const otherInformation = OtherInformationModel.init(this.hearing.other_information);
        return otherInformation.judgePhone ?? participant.phone;
    }

    editJudge() {
        this.bookingService.setEditMode();
    }

    editParticipant(participant: ParticipantModel) {
        this.editJudge();
        if (this.isSummaryPage) {
            this.bookingService.setParticipantEmail(participant.email);
            this.logger.debug(`${this.loggerPrefix} Navigating back to participants to edit`, { participant: participant.email });
            this.router.navigate([PageUrls.AddParticipants]);
        } else {
            this.edit.emit(participant);
        }
    }

    removeParticipant(participant: ParticipantModel) {
        this.logger.debug(`${this.loggerPrefix} Removing participant`, { participant: participant.email });
        this.remove.emit(participant);
    }

    get isRepresentative() {
        return !!this.participant?.representee;
    }

    get isJudge() {
        return this.participant?.is_judge;
    }

    get hasCaseRole() {
        return this.participant?.case_role_name !== 'None';
    }

    get isObserverOrPanelMember() {
        return ['Observer', 'Panel Member'].includes(this.participant?.hearing_role_name);
    }

    get displayCaseRole() {
        return this.hasCaseRole && !this.isObserverOrPanelMember;
    }
}
