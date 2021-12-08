import { Component, DoCheck, EventEmitter, Input, OnChanges, OnInit } from '@angular/core';
import { Constants } from 'src/app/common/constants';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { LinkedParticipantType } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { HearingModel } from '../../../common/model/hearing.model';

@Component({
    selector: 'app-participant-list',
    templateUrl: './participant-list.component.html',
    styleUrls: ['./participant-list.component.scss']
})
export class ParticipantListComponent implements OnInit, OnChanges, DoCheck {
    @Input() hearing: HearingModel;
    sortedParticipants: ParticipantModel[] = [];

    $selectedForEdit = new EventEmitter<string>();
    $selectedForRemove = new EventEmitter<string>();

    @Input() isSummaryPage = false;
    @Input() canEdit = false;

    isEditMode = false;

    constructor(private logger: Logger, private videoHearingsService: VideoHearingsService) {}

    ngDoCheck(): void {
        const containsNewParticipants =
            !this.hearing?.participants?.every(hearingParticipant => this.sortedParticipants.includes(hearingParticipant)) ?? false;
        const containsRemovedParticipants =
            !this.sortedParticipants?.every(sortedParticipant => this.hearing.participants.includes(sortedParticipant)) ?? false;

        if (containsNewParticipants || containsRemovedParticipants) {
            this.sortParticipants();
        }
    }

    ngOnChanges() {
        this.sortParticipants();
    }

    ngOnInit() {
        this.sortParticipants();
    }

    editParticipant(participant: ParticipantModel) {
        this.$selectedForEdit.emit(participant.email);
    }

    removeParticipant(participant: ParticipantModel) {
        this.$selectedForRemove.emit(participant.email);
    }

    get selectedParticipant() {
        return this.$selectedForEdit;
    }

    get selectedParticipantToRemove() {
        return this.$selectedForRemove;
    }

    sortParticipants() {
        if (!this.hearing.participants) {
            this.sortedParticipants = [];
            return;
        }
        const judges = this.hearing.participants.filter(participant => participant.is_judge);
        const staffMembers = this.hearing.participants.filter(
            participant => participant.hearing_role_name === Constants.HearingRoles.StaffMember
        );
        const panelMembersAndWingers = this.hearing.participants.filter(participant =>
            Constants.JudiciaryRoles.includes(participant.hearing_role_name)
        );

        const interpretersAndInterpretees = this.getInterpreterAndInterpretees();
        const others = this.hearing.participants.filter(
            participant =>
                !participant.is_judge &&
                !Constants.OtherParticipantRoles.includes(participant.hearing_role_name) &&
                !interpretersAndInterpretees.includes(participant)
        );
        const observers = this.hearing.participants.filter(
            participant =>
                participant.hearing_role_name === Constants.HearingRoles.Observer && !interpretersAndInterpretees.includes(participant)
        );

        this.sortedParticipants = [
            ...judges,
            ...panelMembersAndWingers,
            ...staffMembers,
            ...others,
            ...interpretersAndInterpretees,
            ...observers
        ];
    }

    private getInterpreterAndInterpretees(): ParticipantModel[] {
        const interpreterInterpreteeList: ParticipantModel[] = [];
        // get the interpreter and the corresponding interpretee names.
        this.clearInterpreteeList();
        const interpreter = this.hearing.participants.filter(participant => participant.hearing_role_name === 'Interpreter');
        interpreter.forEach(interpreterParticipant => {
            let interpretee: ParticipantModel;
            if (interpreterParticipant.interpreterFor) {
                interpretee = this.hearing.participants.find(p => p.email === interpreterParticipant.interpreterFor);
            } else if (interpreterParticipant.linked_participants) {
                const linkedParticipants = interpreterParticipant.linked_participants;
                interpretee = this.hearing.participants.find(p =>
                    linkedParticipants.some(lp => lp.linkedParticipantId === p.id && lp.linkType === LinkedParticipantType.Interpreter)
                );
            }
            interpreterParticipant.interpretee_name = interpretee?.display_name;
            interpreterInterpreteeList.push(interpreterParticipant);

            if (interpretee) {
                interpretee.is_interpretee = true;
                interpreterInterpreteeList.push(interpretee);
            }
        });
        return interpreterInterpreteeList;
    }

    private clearInterpreteeList(): void {
        const interpreteeList: ParticipantModel[] = this.hearing.participants.filter(participant => participant.is_interpretee);
        interpreteeList.forEach(i => {
            i.is_interpretee = false;
        });
    }

    canEditParticipant(particpant: ParticipantModel): boolean {
        if (!this.canEdit || this.videoHearingsService.isConferenceClosed()) {
            return false;
        }
        if (this.videoHearingsService.isHearingAboutToStart() && !particpant.addedDuringHearing) {
            return false;
        }
        return true;
    }
}
