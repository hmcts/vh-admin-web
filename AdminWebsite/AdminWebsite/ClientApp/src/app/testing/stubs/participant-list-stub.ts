import { Component, Input, EventEmitter } from '@angular/core';
import { ParticipantRequest } from 'src/app/services/clients/api-client';
import { VHBooking } from 'src/app/common/model/vh-booking';

@Component({
    selector: 'app-participant-list', template: '<div></div>',
    standalone: false
})
export class ParticipantsListStubComponent {
    @Input() isSummaryPage = false;
    @Input() canEdit = false;

    @Input()
    hearing: VHBooking;
    participants: ParticipantRequest[];
    $selectedForEdit: EventEmitter<string> = new EventEmitter<string>();
    $selectedForRemove: EventEmitter<string> = new EventEmitter<string>();

    get selectedParticipant() {
        return this.$selectedForEdit;
    }

    get selectedParticipantToRemove() {
        return this.$selectedForRemove;
    }
}
