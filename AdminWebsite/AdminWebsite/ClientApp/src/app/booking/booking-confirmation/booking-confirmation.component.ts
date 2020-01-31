import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { HearingDetailsResponse } from 'src/app/services/clients/api-client';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Logger } from '../../services/logger';

@Component({
  selector: 'app-booking-confirmation',
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.css']
})
export class BookingConfirmationComponent implements OnInit {

  hearing: Observable<HearingDetailsResponse>;
  caseNumber: string;
  caseName: string;
  hearingDate: Date;
  private newHearingSessionKey = 'newHearingId';

  constructor(
    private hearingService: VideoHearingsService,
    private bookingPersistService: BookingPersistService,
    private router: Router,
    private logger: Logger) { }

  ngOnInit() {
    this.retrieveSavedHearing();
  }

  retrieveSavedHearing() {
    const hearingId = sessionStorage.getItem(this.newHearingSessionKey);
    this.hearingService.getHearingById(hearingId)
      .subscribe(
        (data: HearingDetailsResponse) => {
          this.caseNumber = data.cases[0].number;
          this.caseName = data.cases[0].name;
          this.hearingDate = new Date(data.scheduled_date_time);
        },
        error => this.logger.error(`Cannot get the hearing by Id: ${hearingId}.`, error)
      );
  }

  viewBookingDetails(): void {
    this.bookingPersistService.selectedHearingId = sessionStorage.getItem(this.newHearingSessionKey);
    this.router.navigate([PageUrls.BookingDetails]);
  }

  bookAnotherHearing(): void {
    this.clearSessionData();
    this.router.navigate([PageUrls.CreateHearing]);
  }

  returnToDashboard(): void {
    this.clearSessionData();
    this.router.navigate([PageUrls.Dashboard]);
  }

  clearSessionData(): void {
    this.hearingService.cancelRequest();
  }
}
