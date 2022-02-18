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
            this.sortedParticipants = this.sortParticipants();
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
        const compareByPartyThenByFirstName = () => (a, b) => {
            const partyA = (a.case_role_name === Constants.None) ? a.hearing_role_name : a.case_role_name;
            const partyB = (b.case_role_name === Constants.None) ? b.hearing_role_name : b.case_role_name;
            if(partyA === partyB){
                return (a.first_name < b.first_name) ? -1 : (a > b) ? 1 : 0;
            }
            return (partyA < partyB) ? -1 : (a > b) ? 1 : 0;
        }

        if (!this.hearing.participants) {
            return;
        }
        const judges = this.hearing.participants.filter(participant => participant.is_judge);

        const staffMembers = this.hearing.participants.filter(
            participant => participant.hearing_role_name === Constants.HearingRoles.StaffMember
        );
        const panelMembers = this.hearing.participants.filter(participant =>
            Constants.JudiciaryRoles.includes((participant.case_role_name === Constants.None)
                ? participant.hearing_role_name
                : participant.case_role_name)
        ).sort(compareByPartyThenByFirstName());

        const observers = this.hearing.participants.filter(
            participant =>
                Constants.HearingRoles.Observer === ((participant.case_role_name === Constants.None)
                    ? participant.hearing_role_name
                    : participant.case_role_name)
        ).sort(compareByPartyThenByFirstName());

        const others = this.hearing.participants.filter(
            participant =>
                !participant.is_judge &&
                !staffMembers.includes(participant) &&
                !panelMembers.includes(participant) &&
                !observers.includes(participant) &&
                participant.hearing_role_name !== Constants.HearingRoles.Interpreter
        ).sort(compareByPartyThenByFirstName());

        const sortedList = [
            ...judges,
            ...panelMembers,
            ...staffMembers,
            ...others,
            ...observers
        ];
        this.injectInterpreters(sortedList);

        return sortedList;
    }

    private injectInterpreters(sortedList: ParticipantModel[]) {
        this.clearInterpreteeList();
        const interpreters = this.hearing.participants.filter(participant =>
            participant.hearing_role_name === Constants.HearingRoles.Interpreter);
        interpreters.forEach(interpreterParticipant => {
            let interpretee: ParticipantModel;
            if (interpreterParticipant.interpreterFor) {
                interpretee = this.hearing.participants.find(p => p.email === interpreterParticipant.interpreterFor);
            } else if (interpreterParticipant.linked_participants) {
                const linkedParticipants = interpreterParticipant.linked_participants;
                interpretee = this.hearing.participants.find(p =>
                    linkedParticipants.some(lp => lp.linkedParticipantId === p.id &&
                        lp.linkType === LinkedParticipantType.Interpreter)
                );
            }
            if (interpretee) {
                interpretee.is_interpretee = true;
            }
            const insertIndex: number = sortedList.findIndex((e) => e.email === interpretee.email) + 1;
            interpreterParticipant.interpretee_name = interpretee?.display_name;
            sortedList.splice(insertIndex, 0, interpreterParticipant);
        });
    }

    private clearInterpreteeList(): void {
        const interpreteeList: ParticipantModel[] = this.hearing.participants.filter(participant => participant.is_interpretee);
        interpreteeList.forEach(i => {
            i.is_interpretee = false;
        });
    }

    canEditParticipant(participant: ParticipantModel): boolean {
        if (!this.canEdit || this.videoHearingsService.isConferenceClosed()) {
            return false;
        }
        return !(this.videoHearingsService.isHearingAboutToStart() && !participant.addedDuringHearing);
    }
}
