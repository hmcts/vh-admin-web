import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HearingRoles } from 'src/app/common/model/hearing-roles.model';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantModel } from '../../common/model/participant.model';
import { BookingService } from '../../services/booking.service';

@Component({
    selector: 'app-participants-list',
    templateUrl: './participants-list.component.html',
    styleUrls: ['./participants-list.component.css']
})
export class ParticipantsListComponent implements OnInit {
    private readonly loggerPrefix = '[ParticipantsList] -';
    @Input()
    participants: ParticipantModel[];

    $selectedForEdit: EventEmitter<string>;
    $selectedForRemove: EventEmitter<string>;

    isSummaryPage = false;
    isEditRemoveVisible = true;

    isEditMode = false;

    constructor(private bookingService: BookingService, private router: Router, private logger: Logger) {
        this.$selectedForEdit = new EventEmitter<string>();
        this.$selectedForRemove = new EventEmitter<string>();
    }

    ngOnInit() {
        const currentUrl = this.router.url;
        if (currentUrl) {
            this.isSummaryPage = currentUrl.includes('summary');
            this.isEditRemoveVisible = !currentUrl.includes('assign-judge');
        }
    }

    editJudge() {
        this.bookingService.setEditMode();
    }

    editParticipant(participantEmail: string) {
        this.bookingService.setEditMode();
        if (this.isSummaryPage) {
            this.bookingService.setParticipantEmail(participantEmail);
            this.logger.debug(`${this.loggerPrefix} Navigating back to participants to edit`, { participant: participantEmail });
            this.router.navigate([PageUrls.AddParticipants]);
        } else {
            // we are on the add participant page
            this.$selectedForEdit.emit(participantEmail);
        }
    }

    removeParticipant(participantEmail: string) {
        this.logger.debug(`${this.loggerPrefix} Removing participant`, { participant: participantEmail });
        this.$selectedForRemove.emit(participantEmail);
    }

    get selectedParticipant() {
        return this.$selectedForEdit;
    }

    get selectedParticipantToRemove() {
        return this.$selectedForRemove;
    }

    isInterpreter(participant: ParticipantModel): boolean {
        return participant.hearing_role_name.toLowerCase().trim() === HearingRoles.INTERPRETER.toLowerCase();
    }
    isRepresentative(participant: ParticipantModel): boolean {
        return participant.hearing_role_name.toLowerCase().trim() === HearingRoles.REPRESENTATIVE.toLowerCase();
    }
    getInterpreteeDisplayName(participant: ParticipantModel): string {
        let interpretee: ParticipantModel;
        if (
            this.isEditMode &&
            participant.hearing_role_name.toLowerCase().trim() === HearingRoles.INTERPRETER &&
            participant.linked_participants.length > 0
        ) {
            interpretee = this.participants.find(p => p.id === participant.linked_participants[0].linkedParticipantId);
        } else {
            interpretee = this.participants.find(p => p.email === participant.interpreterFor);
        }
        const interpretedForName = interpretee ? interpretee.display_name : '';
        return interpretedForName;
    }
    isInterpretee(participant: ParticipantModel): boolean {
        let interpretee: ParticipantModel;
        if (this.isEditMode && participant.linked_participants && participant.linked_participants.length > 0) {
            interpretee = this.participants.find(p => p.id === participant.linked_participants[0].linkedParticipantId);
        } else {
            interpretee = this.participants.find(p => p.interpreterFor === participant.email);
        }
        return interpretee ? true : false;
    }
}
