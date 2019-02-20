import { Component, Input } from '@angular/core';
import { ParticipantRequest } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-participants-list', template: '' })
export class ParticipantsListStubComponent {
    @Input()
    participants: ParticipantRequest[];

}
