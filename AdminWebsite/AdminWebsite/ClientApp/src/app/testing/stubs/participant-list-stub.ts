import { Component, Input, EventEmitter } from '@angular/core';
import { ParticipantRequest } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-participants-list', template: '' })
export class ParticipantsListStubComponent {
    @Input()
    participants: ParticipantRequest[];
  $selectedForEdit: EventEmitter<string> = new EventEmitter<string>();
  $selectedForRemove: EventEmitter<string> = new EventEmitter<string>();
}
