import { Component, DoCheck, EventEmitter, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Constants } from 'src/app/common/constants';
import { LinkedParticipantType } from 'src/app/services/clients/api-client';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { HearingRoleCodes } from '../../../common/model/hearing-roles.model';
import { FeatureFlags, LaunchDarklyService } from '../../../services/launch-darkly.service';
import { takeUntil } from 'rxjs/operators';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { mapJudicialMemberDtoToVHParticipant } from 'src/app/common/model/api-contract-to-client-model-mappers';

@Component({
    selector: 'app-participant-list',
    templateUrl: './participant-list.component.html',
    styleUrls: ['./participant-list.component.scss'],
    standalone: false
})
export class ParticipantListComponent implements OnInit, OnChanges, DoCheck, OnDestroy {
    @Input() hearing: VHBooking;
    @Input() isSummaryPage = false;
    @Input() canEdit = false;

    interpreterEnhancementsEnabled = false;
    sortedParticipants: VHParticipant[] = [];
    sortedJudiciaryMembers: VHParticipant[] = [];

    $selectedForEdit = new EventEmitter<string>();
    $selectedForRemove = new EventEmitter<string>();
    private readonly destroyed$ = new EventEmitter<void>();

    isEditMode = false;

    constructor(
        private readonly videoHearingsService: VideoHearingsService,
        private readonly ldService: LaunchDarklyService
    ) {}

    ngOnDestroy(): void {
        this.destroyed$.unsubscribe();
        this.destroyed$.unsubscribe();
    }

    ngDoCheck(): void {
        const participantsLocal = [...(this.hearing?.participants || [])].sort(this.sortByDisplayName());
        const sortedParticipantslocal = [...(this.sortedParticipants || [])].sort(this.sortByDisplayName());
        const hasParticipantListChanged = JSON.stringify(participantsLocal) !== JSON.stringify(sortedParticipantslocal);
        if (hasParticipantListChanged) {
            this.sortParticipants();
        }

        const judicialMembersLocal =
            this.hearing?.judiciaryParticipants
                ?.map(j => ({
                    email: j.email,
                    displayName: j.displayName,
                    role: j.roleCode,
                    interpretationLanguage: j.interpretationLanguage
                }))
                .sort(this.sortByDisplayNameThenByEmail()) ?? [];
        const sortedJudicialMembersLocal =
            this.sortedJudiciaryMembers
                ?.map(j => ({
                    email: j.email,
                    displayName: j.displayName,
                    role: j.hearingRoleCode,
                    interpretationLanguage: j.interpretation_language
                }))
                .sort(this.sortByDisplayNameThenByEmail()) ?? [];

        const judiciaryEmailListChanged = JSON.stringify(judicialMembersLocal) !== JSON.stringify(sortedJudicialMembersLocal);
        if (judiciaryEmailListChanged) {
            this.sortJoh();
        }
    }

    sortJoh() {
        this.sortJudiciaryMembers();
    }

    sortJudiciaryMembers() {
        if (!this.hearing.judiciaryParticipants) {
            return;
        }

        const judicialJudge = [this.hearing.judiciaryParticipants.filter(j => j.roleCode === 'Judge')][0]?.map(h =>
            mapJudicialMemberDtoToVHParticipant(h, true)
        );
        const judicialPanelMembers = this.getJudicialPanelMembers();

        const sortedJohList = [...judicialJudge, ...judicialPanelMembers];

        sortedJohList.sort((a, b) => {
            if (a.hearingRoleCode.includes('Judge') && !b.hearingRoleCode.includes('Judge')) {
                return -1;
            } else if (!a.hearingRoleCode.includes('Judge') && b.hearingRoleCode.includes('Judge')) {
                return 1;
            } else {
                return 0;
            }
        });
        this.sortedJudiciaryMembers = sortedJohList;
    }

    ngOnChanges() {
        this.sortParticipants();
    }

    ngOnInit() {
        this.ldService
            .getFlag<boolean>(FeatureFlags.interpreterEnhancements)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(flag => {
                this.interpreterEnhancementsEnabled = flag;
            });
        this.sortParticipants();
    }

    editParticipant(participant: VHParticipant) {
        this.$selectedForEdit.emit(participant.email);
    }

    removeParticipant(participant: VHParticipant) {
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

    private sortByDisplayName() {
        return (a: VHParticipant, b: VHParticipant) => {
            if (a.displayName < b.displayName) {
                return -1;
            }
            if (a.displayName > b.displayName) {
                return 1;
            }
            return 0;
        };
    }

    private compareByHearingRoleThenByFirstName() {
        return (a: VHParticipant, b: VHParticipant) => {
            const swapIndices = a > b ? 1 : 0;
            const hearingRoleCodeA = a.hearingRoleCode;
            const hearingRoleCodeB = b.hearingRoleCode;
            if (hearingRoleCodeA === hearingRoleCodeB) {
                return a.firstName < b.firstName ? -1 : swapIndices;
            }
            return hearingRoleCodeA < hearingRoleCodeB ? -1 : swapIndices;
        };
    }

    private sortByDisplayNameThenByEmail() {
        return (a: { displayName: string; email: string }, b: { displayName: string; email: string }) => {
            const displayNameComparison = a.displayName.localeCompare(b.displayName);
            if (displayNameComparison !== 0) {
                return displayNameComparison;
            } else {
                return a.email.localeCompare(b.email);
            }
        };
    }

    private getOthers(staffMembers: VHParticipant[], panelMembers: VHParticipant[], observers: VHParticipant[]) {
        return this.hearing.participants
            .filter(
                participant =>
                    !participant.isJudge &&
                    !staffMembers.includes(participant) &&
                    !panelMembers.includes(participant) &&
                    !observers.includes(participant) &&
                    (!participant.hearingRoleName || participant.hearingRoleName !== Constants.HearingRoles.Interpreter) &&
                    (!participant.hearingRoleCode || participant.hearingRoleCode !== HearingRoleCodes.Interpreter)
            )
            .sort(this.compareByHearingRoleThenByFirstName());
    }

    private getObservers() {
        return this.hearing.participants
            .filter(participant => Constants.HearingRoles.Observer === participant.hearingRoleName)
            .sort(this.compareByHearingRoleThenByFirstName());
    }

    private getJudicialPanelMembers(): VHParticipant[] {
        if (this.hearing.judiciaryParticipants) {
            return this.hearing.judiciaryParticipants
                .filter(j => j.roleCode === 'PanelMember')
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
                .map(h => mapJudicialMemberDtoToVHParticipant(h, false));
        }
    }

    private getPanelMembers() {
        return this.hearing.participants
            .filter(participant => Constants.JudiciaryRoles.includes(participant.hearingRoleName))
            .sort(this.compareByHearingRoleThenByFirstName());
    }

    private getStaffMembers() {
        return this.hearing.participants
            .filter(participant => participant.hearingRoleName === Constants.HearingRoles.StaffMember)
            .sort(this.compareByHearingRoleThenByFirstName());
    }

    private getJudges() {
        return this.hearing.participants.filter(participant => participant.isJudge).sort(this.compareByHearingRoleThenByFirstName());
    }

    private insertInterpreters(sortedList: VHParticipant[]) {
        this.clearInterpreteeList();
        const interpreters = this.hearing.participants.filter(
            participant =>
                participant.hearingRoleName === Constants.HearingRoles.Interpreter ||
                participant.hearingRoleCode === HearingRoleCodes.Interpreter
        );
        interpreters.forEach(interpreterParticipant => {
            let interpretee: VHParticipant;
            if (interpreterParticipant.interpreterFor) {
                interpretee = this.hearing.participants.find(p => p.email === interpreterParticipant.interpreterFor);
            } else if (interpreterParticipant.linkedParticipants) {
                const linkedParticipants = interpreterParticipant.linkedParticipants;
                interpretee = this.hearing.participants.find(p =>
                    linkedParticipants.some(lp => lp.linkedParticipantId === p.id && lp.linkType === LinkedParticipantType.Interpreter)
                );
            }
            if (interpretee) {
                interpretee.isInterpretee = true;
                const insertIndex: number = sortedList.findIndex(pm => pm.email === interpretee.email) + 1;
                interpreterParticipant.interpreteeName = interpretee?.displayName;
                sortedList.splice(insertIndex, 0, interpreterParticipant);
            } else {
                sortedList.push(interpreterParticipant);
            }
        });
    }

    private clearInterpreteeList(): void {
        this.hearing.participants.filter(participant => participant.isInterpretee).forEach(i => (i.isInterpretee = false));
    }

    canEditParticipant(participant: VHParticipant): boolean {
        if (!this.canEdit || this.videoHearingsService.isConferenceClosed()) {
            return false;
        }
        return !(this.videoHearingsService.isHearingAboutToStart() && !participant.addedDuringHearing);
    }
}
