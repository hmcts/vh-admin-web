import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { HearingDetailsResponse } from 'src/app/services/clients/api-client';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { Logger } from '../../services/logger';

@Component({
    selector: 'app-booking-confirmation',
    templateUrl: './booking-confirmation.component.html',
    styleUrls: ['./booking-confirmation.component.css']
})
export class BookingConfirmationComponent implements OnInit, OnDestroy {
    protected readonly loggerPrefix: string = '[BookingConfirmation] -';

    hearing: Observable<HearingDetailsResponse>;
    caseNumber: string;
    caseName: string;
    hearingDate: Date;
    private newHearingSessionKey = 'newHearingId';
    $hearingSubscription: Subscription;

    constructor(
        private hearingService: VideoHearingsService,
        private bookingPersistService: BookingPersistService,
        private router: Router,
        private logger: Logger
    ) {}

    ngOnInit() {
        this.retrieveSavedHearing();
    }

    retrieveSavedHearing() {
        const hearingId = sessionStorage.getItem(this.newHearingSessionKey);
        this.logger.debug(`${this.loggerPrefix} Getting hearing.`, { hearing: hearingId });
        this.$hearingSubscription = this.hearingService.getHearingById(hearingId).subscribe(
            (data: HearingDetailsResponse) => {
                this.caseNumber = data.cases[0].number;
                this.caseName = data.cases[0].name;
                this.hearingDate = new Date(data.scheduled_date_time);
            },
            error => this.logger.error(`${this.loggerPrefix} Cannot get the hearing by Id: ${hearingId}.`, error, { hearing: hearingId })
        );
    }

    viewBookingDetails(): void {
        this.bookingPersistService.selectedHearingId = sessionStorage.getItem(this.newHearingSessionKey);
        this.logger.debug(`${this.loggerPrefix} Clicked viewing booking details.`, {
            hearing: this.bookingPersistService.selectedHearingId
        });
        this.router.navigate([PageUrls.BookingDetails]);
    }

    bookAnotherHearing(): void {
        this.clearSessionData();
        this.logger.debug(`${this.loggerPrefix} Clicked book another hearing.`);
        this.router.navigate([PageUrls.CreateHearing]);
    }

    returnToDashboard(): void {
        this.logger.debug(`${this.loggerPrefix} Clicked return to dashboard.`);
        this.clearSessionData();
        this.router.navigate([PageUrls.Dashboard]);
    }

    clearSessionData(): void {
        this.hearingService.cancelRequest();
    }

    ngOnDestroy() {
        if (this.$hearingSubscription) {
            this.$hearingSubscription.unsubscribe();
        }
    }
}
