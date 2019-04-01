import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingDetailsService } from '../../services/booking-details.service';
import { BookingService } from '../../services/booking.service';
import { HearingDetailsResponse } from '../../services/clients/api-client';
import { UserIdentityService } from '../../services/user-identity.service';
import { map } from 'rxjs/operators';
import { HearingModel } from '../../common/model/hearing.model';
import { PageUrls } from '../../shared/page-url.constants';
import { BookingPersistService } from '../../services/bookings-persist.service';

@Component({
  selector: 'app-booking-details',
  templateUrl: 'booking-details.component.html',
  styleUrls: ['booking-details.component.css']
})
export class BookingDetailsComponent implements OnInit {

  hearing: BookingsDetailsModel;
  booking: HearingModel;
  participants: Array<ParticipantDetailsModel> = [];
  judges: Array<ParticipantDetailsModel> = [];
  isVhOfficerAdmin = false;
  hearingId: string;

  constructor(private videoHearingService: VideoHearingsService,
    private bookingDetailsService: BookingDetailsService,
    private userIdentityService: UserIdentityService,
    private router: Router,
    private bookingService: BookingService,
    private bookingPersistService: BookingPersistService) { }

  ngOnInit() {
    this.hearingId = this.bookingPersistService.selectedHearingId;
    if (this.hearingId) {
      this.videoHearingService.getHearingById(this.hearingId).subscribe(data => {
        this.mapHearing(data);
        // mapping to Hearing model for edit on summary page
        this.booking = this.videoHearingService.mapHearingDetailsResponseToHearingModel(data);
        this.setBookingInStorage();
      });
    }
    this.userIdentityService.getUserInformation().pipe(map(userProfile => {
      if (userProfile && userProfile.is_vh_officer_administrator_role) {
        this.isVhOfficerAdmin = true;
      }
    }));
  }

  mapHearing(hearingResponse: HearingDetailsResponse) {
    this.hearing = this.bookingDetailsService.mapBooking(hearingResponse);
    const participants_and_judges = this.bookingDetailsService.mapBookingParticipants(hearingResponse);
    this.participants = participants_and_judges.participants;
    this.judges = participants_and_judges.judges;
  }

  mapResponseToModel(hearingResponse: HearingDetailsResponse): HearingModel {
    return this.videoHearingService.mapHearingDetailsResponseToHearingModel(hearingResponse);
  }

  navigateBack() {
    this.router.navigate([PageUrls.BookingsList]);
  }

  setBookingInStorage() {
    this.bookingService.resetEditMode();
    this.bookingService.setExistingCaseType(this.booking.case_type);
    this.videoHearingService.updateHearingRequest(this.booking);
  }

  editHearing() {
    this.router.navigate([PageUrls.Summary]);
  }
}
