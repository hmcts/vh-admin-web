import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { JudiciaryParticipantDetailsModel } from 'src/app/common/model/judiciary-participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { Constants } from '../../common/constants';

@Component({
    selector: 'app-booking-participant-list',
    templateUrl: 'booking-participant-list.component.html',
    styleUrls: ['booking-participant-list.component.scss']
})
export class BookingParticipantListComponent {
    private _participants: Array<ParticipantDetailsModel> = [];
    private _judiciaryParticipants: Array<JudiciaryParticipantDetailsModel> = [];
    sortedParticipants: ParticipantDetailsModel[] = [];
    sortedJudiciaryMembers: JudiciaryParticipantDetailsModel[] = [];

    @Input()
    set participants(participants: Array<ParticipantDetailsModel>) {
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
    hearing: BookingsDetailsModel;
    @Input()
    judges: Array<ParticipantDetailsModel> = [];
    @Input()
    vh_officer_admin: boolean;

    get participants(): Array<ParticipantDetailsModel> {
        let indexItem = 0;
        this._participants.forEach(x => {
            x.IndexInList = indexItem;
            indexItem++;
        });
        return this._participants;
    }

    private sortParticipants() {
        const compareByHearingRoleThenByFirstName = () => (a: ParticipantDetailsModel, b: ParticipantDetailsModel) => {
            const swapIndices = a > b ? 1 : 0;
            const hearingRoleA = a.HearingRoleName;
            const hearingRoleB = b.HearingRoleName;
            if (hearingRoleA === hearingRoleB) {
                return a.FirstName < b.FirstName ? -1 : swapIndices;
            }
            return hearingRoleA < hearingRoleB ? -1 : swapIndices;
        };
        const judges = this.participants.filter(participant => participant.HearingRoleName === Constants.Judge);
        const staffMember = this.participants.filter(participant => participant.HearingRoleName === Constants.HearingRoles.StaffMember);
        const panelMembersAndWingers = this.participants
            .filter(participant => Constants.JudiciaryRoles.includes(participant.HearingRoleName))
            .sort(compareByHearingRoleThenByFirstName());
        const interpreters = this.participants.filter(participant => participant.isInterpreter);
        const observers = this.participants.filter(participant => Constants.HearingRoles.Observer === participant.HearingRoleName);
        const others = this.participants
            .filter(
                participant =>
                    !judges.includes(participant) &&
                    !panelMembersAndWingers.includes(participant) &&
                    !staffMember.includes(participant) &&
                    !interpreters.includes(participant) &&
                    !observers.includes(participant)
            )
            .sort(compareByHearingRoleThenByFirstName());
        const sorted = [...judges, ...panelMembersAndWingers, ...staffMember, ...others, ...observers];
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

    private insertInterpreters(interpreters: ParticipantDetailsModel[], sorted: ParticipantDetailsModel[]) {
        interpreters.forEach(interpreterParticipant => {
            let interpretee: ParticipantDetailsModel;
            if (interpreterParticipant.LinkedParticipants) {
                const linkedParticipants = interpreterParticipant.LinkedParticipants;
                interpretee = this._participants.find(p => linkedParticipants.some(lp => lp.linked_id === p.ParticipantId));
            }
            if (interpretee) {
                const insertIndex: number = sorted.findIndex(pdm => pdm.ParticipantId === interpretee.ParticipantId) + 1;
                sorted.splice(insertIndex, 0, interpreterParticipant);
            } else {
                sorted.push(interpreterParticipant);
            }
        });
    }
}
