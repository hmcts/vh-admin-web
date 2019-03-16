import { Component, Input, OnInit } from '@angular/core';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { UserIdentityService } from '../../services/user-identity.service';

@Component({
  selector: 'app-booking-participant-details',
  templateUrl: 'participant-details.component.html',
  styleUrls: ['participant-details.component.css']
})
export class ParticipantDetailsComponent {

  @Input()
  participant: ParticipantDetailsModel = null;

  @Input()
  vh_officer_admin: boolean;

  constructor() { }
}
