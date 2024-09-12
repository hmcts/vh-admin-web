import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { OtherInformationModel } from '../../../common/model/other-information.model';
import { HearingModel } from '../../../common/model/hearing.model';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Constants } from 'src/app/common/constants';
import { HearingRoleCodes } from '../../../common/model/hearing-roles.model';

@Component({
    selector: 'app-participant-item',
    templateUrl: './participant-item.component.html',
    styleUrls: ['./participant-item.component.scss']
})
export class ParticipantItemComponent implements OnInit {
    private readonly loggerPrefix = '[ParticipantList - Item] -';

    @Input() participant: ParticipantModel;
    @Input() hearing: HearingModel;
    @Input() canEdit = false;
    @Input() isSummaryPage = false;
    @Input() interpreterEnhancementsEnabled = false;

    @Output() edit = new EventEmitter<ParticipantModel>();
    @Output() remove = new EventEmitter<ParticipantModel>();

    staffMemberRole = Constants.HearingRoles.StaffMember;
    showParticipantActions: boolean;
    showJudicaryActions: boolean;

    constructor(
        private bookingService: BookingService,
        private logger: Logger,
        private router: Router,
        private videoHearingsService: VideoHearingsService
    ) {}

    ngOnInit(): void {
        this.showParticipantActions = this.router.url.includes(PageUrls.AddParticipants) || this.router.url.includes(PageUrls.Summary);
        this.showJudicaryActions =
            this.router.url.includes(PageUrls.AddJudicialOfficeHolders) || this.router.url.includes(PageUrls.Summary);
    }

    getJudgeUser(participant: ParticipantModel): string {
        return participant.username;
    }

    getJudgeEmail(): string {
        if (this.participant.isJudiciaryMember) {
            return null; // username and email are the same, no need to show it twice
        }
        const otherInformation = OtherInformationModel.init(this.hearing.other_information);
        return otherInformation.JudgeEmail;
    }

    getJudgePhone(participant: ParticipantModel): string {
        if (this.participant.isJudiciaryMember) {
            return this.participant.phone; // ejud data does not have phone number
        }
        const otherInformation = OtherInformationModel.init(this.hearing.other_information);
        return otherInformation.JudgePhone ?? participant.phone;
    }

    editJudge() {
        this.bookingService.setEditMode();
    }

    editParticipant(participant: ParticipantModel) {
        this.editJudge();

        if (this.isSummaryPage && !this.participant.isJudiciaryMember) {
            this.bookingService.setParticipantEmail(participant.email);
            this.logger.debug(`${this.loggerPrefix} Navigating back to participants to edit`, { participant: participant.email });
            this.router.navigate([PageUrls.AddParticipants]);
        } else if (this.isSummaryPage && this.participant.isJudiciaryMember) {
            this.logger.debug(`${this.loggerPrefix} Navigating back to judicial office holders to edit`, {
                participant: participant.email
            });
            this.bookingService.setParticipantEmail(participant.email);
            this.router.navigate([PageUrls.AddJudicialOfficeHolders]);
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

    get isStaffMember() {
        return this.participant?.hearing_role_name === Constants.HearingRoles.StaffMember;
    }

    get hasCaseRole() {
        return this.participant?.case_role_name !== 'None';
    }

    get isObserverOrPanelMember() {
        return (
            ['Observer', 'Panel Member'].includes(this.participant?.hearing_role_name) ||
            [HearingRoleCodes.Observer, 'PanelMember'].includes(this.participant?.hearing_role_code)
        );
    }

    get displayCaseRole() {
        return this.hasCaseRole && !this.isObserverOrPanelMember;
    }

    get isInterpreter() {
        return this.participant.hearing_role_name === 'Interpreter' || this.participant.hearing_role_code === HearingRoleCodes.Interpreter;
    }

    get isInterpretee() {
        return this.participant.is_interpretee;
    }

    canEditJudge(): boolean {
        if (!this.canEdit || this.videoHearingsService.isConferenceClosed() || this.videoHearingsService.isHearingAboutToStart()) {
            return false;
        }
        return true;
    }
}
