import { Component, Input } from '@angular/core';

import { ParticipantRequest } from '../../services/clients/api-client';

@Component({
  selector: 'app-participants-list',
  templateUrl: './participants-list.component.html',
  styleUrls: ['./participants-list.component.css']
})
export class ParticipantsListComponent {

  @Input()
  participants: ParticipantRequest[];

  constructor() {
  }
}
