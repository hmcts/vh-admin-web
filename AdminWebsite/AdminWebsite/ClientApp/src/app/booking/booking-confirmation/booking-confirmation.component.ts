import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { HearingModel } from 'src/app/common/model/hearing.model';
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

  constructor(
    private hearingService: VideoHearingsService,
    private router: Router) { }

  ngOnInit() {
    this.retrieveSavedHearing();
  }

  private retrieveSavedHearing() {
    this.hearing = this.hearingService.getHearingById('52B8A9E6-9EAF-4990-923A-263930BE140C');
    console.log(this.hearing);
    this.caseNumber = 'Case number 01';
    this.caseName = 'bbc vs hmrc';
    this.hearingDate = new Date();
  }

  private bookAnotherHearing(): void {
    this.clearSessionData();
    this.router.navigate([PageUrls.CreateHearing]);
  }

  private returnToDashboard(): void {
    this.clearSessionData();
  }

  private clearSessionData(): void {
    this.hearingService.cancelRequest();
  }
}
