import { Component, OnInit } from '@angular/core';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { AddParticipantBaseDirective } from 'src/app/booking/add-participant-base/add-participant-base.component'
import { Router } from '@angular/router';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';

@Component({
  selector: 'app-add-staff-member',
  templateUrl: './add-staff-member.component.html',
  styleUrls: ['./add-staff-member.component.css']
})
export class AddStaffMemberComponent extends AddParticipantBaseDirective implements OnInit {
  private staffMember: ParticipantModel;

  constructor(
    protected bookingService: BookingService,
    protected router: Router,
    protected videoHearingService: VideoHearingsService,
    protected logger: Logger) {
      super(bookingService, router, videoHearingService, logger);
    }

  ngOnInit(): void {
    this.staffMember = new ParticipantModel();
    this.initialiseForm();
  }
  
  saveStaffMember(): void {
    console.log(this.staffMember);
  }
}
