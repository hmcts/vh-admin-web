import { Component, Input } from '@angular/core';
import { Constants } from '../../common/constants';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';

@Component({
    selector: 'app-booking-participant-list',
    templateUrl: 'booking-participant-list.component.html',
    styleUrls: ['booking-participant-list.component.scss'],
    standalone: false
})
export class BookingParticipantListComponent {
    private _participants: Array<VHParticipant> = [];
    private _judiciaryParticipants: Array<JudicialMemberDto> = [];
    sortedParticipants: VHParticipant[] = [];
    sortedJudiciaryMembers: JudicialMemberDto[] = [];

    @Input()
    set participants(participants: Array<VHParticipant>) {
        this._participants = participants;
        this.sortParticipants();
        this.sortJudiciaryMembers();
    }
    @Input()
    set judiciaryParticipants(judiciaryParticipants: Array<JudicialMemberDto>) {
        this._judiciaryParticipants = judiciaryParticipants;
        this.sortParticipants();
        this.sortJudiciaryMembers();
    }
    @Input()
    hearing: VHBooking;
    @Input()
    vh_officer_admin: boolean;

    get participants(): Array<VHParticipant> {
        let indexItem = 0;
        this._participants.forEach(x => {
            indexItem++;
        });
        return this._participants;
    }

    private sortParticipants() {
        const compareByHearingRoleThenByFirstName = () => (a: VHParticipant, b: VHParticipant) => {
            const swapIndices = a > b ? 1 : 0;
            const hearingRoleA = a.hearingRoleName;
            const hearingRoleB = b.hearingRoleName;
            if (hearingRoleA === hearingRoleB) {
                return a.firstName < b.firstName ? -1 : swapIndices;
            }
            return hearingRoleA < hearingRoleB ? -1 : swapIndices;
        };
        const staffMember = this.participants.filter(participant => participant.hearingRoleName === Constants.HearingRoles.StaffMember);
        const panelMembersAndWingers = this.participants
            .filter(participant => Constants.JudiciaryRoles.includes(participant.hearingRoleName))
            .sort(compareByHearingRoleThenByFirstName());
        const interpreters = this.participants.filter(participant => participant.isInterpreter);
        const observers = this.participants.filter(participant => Constants.HearingRoles.Observer === participant.hearingRoleName);
        const others = this.participants
            .filter(
                participant =>
                    !panelMembersAndWingers.includes(participant) &&
                    !staffMember.includes(participant) &&
                    !interpreters.includes(participant) &&
                    !observers.includes(participant)
            )
            .sort(compareByHearingRoleThenByFirstName());
        const sorted = [...panelMembersAndWingers, ...staffMember, ...others, ...observers];
        this.insertInterpreters(interpreters, sorted);
        this.sortedParticipants = sorted;
    }

    sortJudiciaryMembers() {
        if (!this._judiciaryParticipants) {
            return;
        }

        const judicialJudge = [this._judiciaryParticipants.filter(j => j.roleCode === 'Judge')][0];
        const judicialPanelMembers = this._judiciaryParticipants.filter(j => j.roleCode === 'PanelMember');

        const sortedJohList = [...judicialJudge, ...judicialPanelMembers];

        sortedJohList.sort((a, b) => {
            if (a.roleCode.includes('Judge') && !b.roleCode.includes('Judge')) {
                return -1;
            } else if (!a.roleCode.includes('Judge') && b.roleCode.includes('Judge')) {
                return 1;
            } else {
                return a.firstName.localeCompare(b.firstName);
            }
        });
        this.sortedJudiciaryMembers = sortedJohList;
    }

    private insertInterpreters(interpreters: VHParticipant[], sorted: VHParticipant[]) {
        interpreters.forEach(interpreterParticipant => {
            let interpretee: VHParticipant;
            if (interpreterParticipant.linkedParticipants) {
                const linkedParticipants = interpreterParticipant.linkedParticipants;
                interpretee = this._participants.find(p => linkedParticipants.some(lp => lp.linkedParticipantId === p.id));
            }
            if (interpretee) {
                const insertIndex: number = sorted.findIndex(pdm => pdm.id === interpretee.id) + 1;
                sorted.splice(insertIndex, 0, interpreterParticipant);
            } else {
                sorted.push(interpreterParticipant);
            }
        });
    }
}
