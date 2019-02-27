import { Component, Input } from '@angular/core';

import { ParticipantModel } from '../../common/model/participant.model';

@Component({
  selector: 'app-participants-list',
  templateUrl: './participants-list.component.html',
  styleUrls: ['./participants-list.component.css']
})
export class ParticipantsListComponent {

  @Input()
  participants: ParticipantModel[];

  constructor() {
  }
}
