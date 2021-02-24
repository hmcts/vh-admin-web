import { Component, Input, EventEmitter } from '@angular/core';
import { ParticipantRequest } from 'src/app/services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';

@Component({ selector: 'app-participant-list', template: '<div></div>' })
export class ParticipantsListStubComponent {
    @Input()
    hearing: HearingModel;
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
