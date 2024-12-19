import { Component, Input } from '@angular/core';
import { JudiciaryParticipantDetailsModel } from 'src/app/common/model/judiciary-participant-details.model';
import { Constants } from '../../common/constants';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { VHBooking } from 'src/app/common/model/vh-booking';

@Component({
    selector: 'app-booking-participant-list',
    templateUrl: 'booking-participant-list.component.html',
    styleUrls: ['booking-participant-list.component.scss']
})
export class BookingParticipantListComponent {
    private _participants: Array<VHParticipant> = [];
    private _judiciaryParticipants: Array<JudiciaryParticipantDetailsModel> = [];
    sortedParticipants: VHParticipant[] = [];
    sortedJudiciaryMembers: JudiciaryParticipantDetailsModel[] = [];

    @Input()
    set participants(participants: Array<VHParticipant>) {
        this._participants = participants;
        this.sortParticipants();
        this.sortJudiciaryMembers();
    }
    @Input()
    set judiciaryParticipants(judiciaryParticipants: Array<JudiciaryParticipantDetailsModel>) {
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
            x.indexInList = indexItem;
            indexItem++;
        });
        return this._participants;
    }

    private sortParticipants() {
        const compareByHearingRoleThenByFirstName = () => (a: VHParticipant, b: VHParticipant) => {
            const swapIndices = a > b ? 1 : 0;
            const hearingRoleA = a.hearing_role_name;
            const hearingRoleB = b.hearing_role_name;
            if (hearingRoleA === hearingRoleB) {
                return a.first_name < b.first_name ? -1 : swapIndices;
            }
            return hearingRoleA < hearingRoleB ? -1 : swapIndices;
        };
        const staffMember = this.participants.filter(participant => participant.hearing_role_name === Constants.HearingRoles.StaffMember);
        const panelMembersAndWingers = this.participants
            .filter(participant => Constants.JudiciaryRoles.includes(participant.hearing_role_name))
            .sort(compareByHearingRoleThenByFirstName());
        const interpreters = this.participants.filter(participant => participant.isInterpreter);
        const observers = this.participants.filter(participant => Constants.HearingRoles.Observer === participant.hearing_role_name);
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
            if (interpreterParticipant.linked_participants) {
                const linkedParticipants = interpreterParticipant.linked_participants;
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
