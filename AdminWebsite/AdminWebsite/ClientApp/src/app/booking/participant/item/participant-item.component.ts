import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { OtherInformationModel } from '../../../common/model/other-information.model';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Constants } from 'src/app/common/constants';
import { HearingRoleCodes } from '../../../common/model/hearing-roles.model';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({
    selector: 'app-participant-item',
    templateUrl: './participant-item.component.html',
    styleUrls: ['./participant-item.component.scss'],
    standalone: false
})
export class ParticipantItemComponent implements OnInit {
    private readonly loggerPrefix = '[ParticipantList - Item] -';

    @Input() participant: VHParticipant;
    @Input() hearing: VHBooking;
    @Input() canEdit = false;
    @Input() isSummaryPage = false;
    @Input() interpreterEnhancementsEnabled = false;

    @Output() edit = new EventEmitter<VHParticipant>();
    @Output() remove = new EventEmitter<VHParticipant>();

    staffMemberRole = Constants.HearingRoles.StaffMember;
    showParticipantActions: boolean;
    showJudicaryActions: boolean;

    constructor(
        private readonly bookingService: BookingService,
        private readonly logger: Logger,
        private readonly router: Router,
        private readonly videoHearingsService: VideoHearingsService
    ) {}

    ngOnInit(): void {
        this.showParticipantActions = this.router.url.includes(PageUrls.AddParticipants) || this.router.url.includes(PageUrls.Summary);
        this.showJudicaryActions =
            this.router.url.includes(PageUrls.AddJudicialOfficeHolders) || this.router.url.includes(PageUrls.Summary);
    }

    getJudgeUser(participant: VHParticipant): string {
        return participant.username;
    }

    getJudgeEmail(): string {
        if (this.participant.isJudiciaryMember) {
            return null; // username and email are the same, no need to show it twice
        }
        const otherInformation = OtherInformationModel.init(this.hearing.otherInformation);
        return otherInformation.JudgeEmail;
    }

    getJudgePhone(participant: VHParticipant): string {
        if (this.participant.isJudiciaryMember) {
            return this.participant.phone; // ejud data does not have phone number
        }
        const otherInformation = OtherInformationModel.init(this.hearing.otherInformation);
        return otherInformation.JudgePhone ?? participant.phone;
    }

    editJudge() {
        this.bookingService.setEditMode();
    }

    editParticipant(participant: VHParticipant) {
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

    removeParticipant(participant: VHParticipant) {
        this.logger.debug(`${this.loggerPrefix} Removing participant`, { participant: participant.email });
        this.remove.emit(participant);
    }

    get isRepresentative() {
        return !!this.participant?.representee;
    }

    get isJudge() {
        return this.participant?.isJudge;
    }

    get isStaffMember() {
        return this.participant?.hearingRoleName === Constants.HearingRoles.StaffMember;
    }

    get isObserverOrPanelMember() {
        return (
            ['Observer', 'Panel Member'].includes(this.participant?.hearingRoleName) ||
            [HearingRoleCodes.Observer, 'PanelMember'].includes(this.participant?.hearingRoleCode)
        );
    }

    get isInterpreter() {
        return this.participant.hearingRoleName === 'Interpreter' || this.participant.hearingRoleCode === HearingRoleCodes.Interpreter;
    }

    get isInterpretee() {
        return this.participant.isInterpretee;
    }

    canEditJudge(): boolean {
        if (!this.canEdit || this.videoHearingsService.isConferenceClosed() || this.videoHearingsService.isHearingAboutToStart()) {
            return false;
        }
        return true;
    }
}
