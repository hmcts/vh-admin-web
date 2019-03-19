import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { HearingDetailsResponse } from 'src/app/services/clients/api-client';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';

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
    private router: Router) { }

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
        error => console.error(error)
      );
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
