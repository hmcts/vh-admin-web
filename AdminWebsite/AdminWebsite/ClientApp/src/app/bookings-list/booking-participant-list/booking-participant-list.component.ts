import { Component, Input } from '@angular/core';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';

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
        const judges = this.participants.filter(participant => participant.HearingRoleName === 'Judge');
        const panelMembersAndWingers = this.participants.filter(participant =>
            ['Panel Member', 'Winger'].includes(participant.HearingRoleName)
        );
        const interpretersAndInterpretees = this.participants.filter(
            participant => participant.HearingRoleName === 'Interpreter' || participant.isInterpretee
        );
        const observers = this.participants.filter(participant => participant.HearingRoleName === 'Observer' && !participant.IsInterpretee);
        const others = this.participants.filter(
            participant =>
                !judges.includes(participant) &&
                !panelMembersAndWingers.includes(participant) &&
                !interpretersAndInterpretees.includes(participant) &&
                !observers.includes(participant)
        );
        this.sortedParticipants = [...judges, ...panelMembersAndWingers, ...others, ...interpretersAndInterpretees, ...observers];
    }
}
