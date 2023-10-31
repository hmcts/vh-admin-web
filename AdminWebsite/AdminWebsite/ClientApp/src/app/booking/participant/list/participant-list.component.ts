import { Component, DoCheck, EventEmitter, Input, OnChanges, OnInit } from '@angular/core';
import { Constants } from 'src/app/common/constants';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { LinkedParticipantType } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { HearingModel } from '../../../common/model/hearing.model';
import { JudicialMemberDto } from '../../judicial-office-holders/models/add-judicial-member.model';

@Component({
    selector: 'app-participant-list',
    templateUrl: './participant-list.component.html',
    styleUrls: ['./participant-list.component.scss']
})
export class ParticipantListComponent implements OnInit, OnChanges, DoCheck {
    @Input() hearing: HearingModel;
    sortedParticipants: ParticipantModel[] = [];
    sortedJudiciaryMembers: ParticipantModel[] = [];

    $selectedForEdit = new EventEmitter<string>();
    $selectedForRemove = new EventEmitter<string>();

    @Input() isSummaryPage = false;
    @Input() canEdit = false;

    isEditMode = false;

    constructor(private logger: Logger, private videoHearingsService: VideoHearingsService) {}

    ngDoCheck(): void {
        const participantsEmails = this.hearing?.participants?.map(p => p).sort() ?? [];
        const sortedParticipantsEmails = this.sortedParticipants?.map(p => p).sort() ?? [];
        const hasParticipantListChanged = JSON.stringify(participantsEmails) !== JSON.stringify(sortedParticipantsEmails);
        if (hasParticipantListChanged) {
            this.sortParticipants();
        }

        const judicialMembersEmails = this.hearing?.judiciaryParticipants?.map(j => j.email).sort() ?? [];
        const sortedJudicialMembersEmails = this.sortedJudiciaryMembers?.map(j => j.email).sort() ?? [];

        const judiciaryEmailListChanged = JSON.stringify(judicialMembersEmails) !== JSON.stringify(sortedJudicialMembersEmails);
        if (judiciaryEmailListChanged) {
            this.sortJudiciaryMembers();
        }
    }

    sortJudiciaryMembers() {
        if (!this.hearing.judiciaryParticipants) {
            return;
        }

        const judicialJudge = [this.hearing.judiciaryParticipants.filter(j => j.roleCode === 'Judge')][0]?.map(h => {
            return new ParticipantModel({
                is_judge: true,
                title: 'Judge',
                first_name: h.firstName,
                last_name: h.lastName,
                hearing_role_name: 'Judge',
                username: h.email,
                email: h.email,
                is_exist_person: true,
                user_role_name: 'Judge',
                isJudiciaryMember: true,
                hearing_role_code: 'Judge',
                phone: h.telephone,
                display_name: h.displayName
            });
        });
        const judicialPanelMembers = this.getJudicialPanelMembers();

        const sortedJohList = [...judicialJudge, ...judicialPanelMembers];

        this.sortedJudiciaryMembers = sortedJohList.sort((a, b) => {
            if (a.hearing_role_code.includes('Judge') && !b.hearing_role_code.includes('Judge')) {
                return -1;
            } else if (!a.hearing_role_code.includes('Judge') && b.hearing_role_code.includes('Judge')) {
                return 1;
            } else {
                return 0;
            }
        });
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
        if (!this.hearing.participants && !this.hearing.judiciaryParticipants) {
            return;
        }
        const judges = this.getJudges();
        const staffMembers = this.getStaffMembers();
        const panelMembers = this.getPanelMembers();
        const observers = this.getObservers();
        const others = this.getOthers(staffMembers, panelMembers, observers);

        const sortedList = [...judges, ...panelMembers, ...staffMembers, ...others, ...observers];

        this.insertInterpreters(sortedList);
        this.sortedParticipants = sortedList;
    }

    private compareByPartyThenByFirstName() {
        return (a, b) => {
            const swapIndices = a > b ? 1 : 0;
            const partyA = a.case_role_name === Constants.None ? a.hearing_role_name : a.case_role_name;
            const partyB = b.case_role_name === Constants.None ? b.hearing_role_name : b.case_role_name;
            if (partyA === partyB) {
                return a.first_name < b.first_name ? -1 : swapIndices;
            }
            return partyA < partyB ? -1 : swapIndices;
        };
    }

    private getOthers(staffMembers: ParticipantModel[], panelMembers: ParticipantModel[], observers: ParticipantModel[]) {
        return this.hearing.participants
            .filter(
                participant =>
                    !participant.is_judge &&
                    !staffMembers.includes(participant) &&
                    !panelMembers.includes(participant) &&
                    !observers.includes(participant) &&
                    participant.hearing_role_name !== Constants.HearingRoles.Interpreter
            )
            .sort(this.compareByPartyThenByFirstName());
    }

    private getObservers() {
        return this.hearing.participants
            .filter(
                participant =>
                    Constants.HearingRoles.Observer ===
                    (participant.case_role_name === Constants.None ? participant.hearing_role_name : participant.case_role_name)
            )
            .sort(this.compareByPartyThenByFirstName());
    }

    private getJudicialPanelMembers(): ParticipantModel[] {
        return this.hearing.judiciaryParticipants
            .filter(j => j.roleCode === 'PanelMember')
            .sort(this.compareByPartyThenByFirstName())
            .map(h => {
                return new ParticipantModel({
                    is_judge: false,
                    first_name: h.firstName,
                    last_name: h.lastName,
                    hearing_role_name: 'Panel Member',
                    username: h.email,
                    email: h.email,
                    is_exist_person: true,
                    user_role_name: 'PanelMember',
                    isJudiciaryMember: true,
                    hearing_role_code: 'PanelMember',
                    phone: h.telephone
                });
            });
    }

    private getPanelMembers() {
        return this.hearing.participants
            .filter(participant =>
                Constants.JudiciaryRoles.includes(
                    participant.case_role_name === Constants.None ? participant.hearing_role_name : participant.case_role_name
                )
            )
            .sort(this.compareByPartyThenByFirstName());
    }

    private getStaffMembers() {
        return this.hearing.participants
            .filter(participant => participant.hearing_role_name === Constants.HearingRoles.StaffMember)
            .sort(this.compareByPartyThenByFirstName());
    }

    private getJudges() {
        return this.hearing.participants.filter(participant => participant.is_judge).sort(this.compareByPartyThenByFirstName());
    }

    private insertInterpreters(sortedList: ParticipantModel[]) {
        this.clearInterpreteeList();
        const interpreters = this.hearing.participants.filter(
            participant => participant.hearing_role_name === Constants.HearingRoles.Interpreter
        );
        interpreters.forEach(interpreterParticipant => {
            let interpretee: ParticipantModel;
            if (interpreterParticipant.interpreterFor) {
                interpretee = this.hearing.participants.find(p => p.email === interpreterParticipant.interpreterFor);
            } else if (interpreterParticipant.linked_participants) {
                const linkedParticipants = interpreterParticipant.linked_participants;
                interpretee = this.hearing.participants.find(p =>
                    linkedParticipants.some(lp => lp.linkedParticipantId === p.id && lp.linkType === LinkedParticipantType.Interpreter)
                );
            }
            if (interpretee) {
                interpretee.is_interpretee = true;
                const insertIndex: number = sortedList.findIndex(pm => pm.email === interpretee.email) + 1;
                interpreterParticipant.interpretee_name = interpretee?.display_name;
                sortedList.splice(insertIndex, 0, interpreterParticipant);
            } else {
                sortedList.push(interpreterParticipant);
            }
        });
    }

    private clearInterpreteeList(): void {
        this.hearing.participants.filter(participant => participant.is_interpretee).forEach(i => (i.is_interpretee = false));
    }

    canEditParticipant(participant: ParticipantModel): boolean {
        if (!this.canEdit || this.videoHearingsService.isConferenceClosed()) {
            return false;
        }
        return !(this.videoHearingsService.isHearingAboutToStart() && !participant.addedDuringHearing);
    }
}
