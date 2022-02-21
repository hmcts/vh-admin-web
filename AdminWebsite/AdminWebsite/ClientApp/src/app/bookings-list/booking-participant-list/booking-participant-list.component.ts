import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { Constants } from '../../common/constants';

@Component({
    selector: 'app-booking-participant-list',
    templateUrl: 'booking-participant-list.component.html',
    styleUrls: ['booking-participant-list.component.scss']
})
export class BookingParticipantListComponent {
    private _participants: Array<ParticipantDetailsModel> = [];
    sortedParticipants: ParticipantDetailsModel[] = [];

    @Input()
    set participants(participants: Array<ParticipantDetailsModel>) {
        this._participants = participants;
        this.sortParticipants();
    }
    @Input()
    hearing: BookingsDetailsModel;
    @Input()
    judges: Array<ParticipantDetailsModel> = [];
    @Input()
    vh_officer_admin: boolean;

    constructor() {}

    get participants(): Array<ParticipantDetailsModel> {
        let indexItem = 0;
        this._participants.forEach(x => {
            x.IndexInList = indexItem;
            indexItem++;
        });
        return this._participants;
    }

    private sortParticipants() {
        const compareByPartyThenByFirstName = () => (a, b) => {
            const partyA = a.CaseRoleName === Constants.None ? a.HearingRoleName : a.CaseRoleName;
            const partyB = b.CaseRoleName === Constants.None ? b.HearingRoleName : b.CaseRoleName;
            if (partyA === partyB) {
                return a.FirstName < b.FirstName ? -1 : a > b ? 1 : 0;
            }
            return partyA < partyB ? -1 : a > b ? 1 : 0;
        };
        const judges = this.participants.filter(participant => participant.HearingRoleName === Constants.Judge);
        const staffMember = this.participants.filter(participant => participant.HearingRoleName === Constants.HearingRoles.StaffMember);
        const panelMembersAndWingers = this.participants
            .filter(participant =>
                Constants.JudiciaryRoles.includes(
                    participant.CaseRoleName === Constants.None ? participant.HearingRoleName : participant.CaseRoleName
                )
            )
            .sort(compareByPartyThenByFirstName());
        const interpreters = this.participants.filter(participant => participant.isInterpreter);
        const observers = this.participants.filter(
            participant =>
                Constants.HearingRoles.Observer ===
                (participant.CaseRoleName === Constants.None ? participant.HearingRoleName : participant.CaseRoleName)
        );
        const others = this.participants
            .filter(
                participant =>
                    !judges.includes(participant) &&
                    !panelMembersAndWingers.includes(participant) &&
                    !staffMember.includes(participant) &&
                    !interpreters.includes(participant) &&
                    !observers.includes(participant)
            )
            .sort(compareByPartyThenByFirstName());
        const sorted = [...judges, ...panelMembersAndWingers, ...staffMember, ...others, ...observers];
        this.insertInterpreters(interpreters, sorted);
        this.sortedParticipants = sorted;
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
