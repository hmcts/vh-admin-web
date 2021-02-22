import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingDetailsService } from '../../services/booking-details.service';
import { BookingService } from '../../services/booking.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import {
    BookHearingException,
    HearingDetailsResponse,
    UpdateBookingStatus,
    UpdateBookingStatusRequest,
    UpdateBookingStatusResponse,
    UserProfileResponse
} from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';

@Component({
    selector: 'app-booking-details',
    templateUrl: 'booking-details.component.html',
    styleUrls: ['booking-details.component.css']
})
export class BookingDetailsComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[BookingDetails] -';
    hearing: BookingsDetailsModel;
    booking: HearingModel;
    participants: Array<ParticipantDetailsModel> = [];
    judges: Array<ParticipantDetailsModel> = [];
    isVhOfficerAdmin = false;
    showCancelBooking: boolean;
    showConfirming: boolean;
    showConfirmingFailed: boolean;
    isConfirmationTimeValid = true;
    hearingId: string;
    updateBookingStatusRequest: UpdateBookingStatusRequest;

    $timeObserver = interval(60000);
    timeSubscription: Subscription;
    $subscriptions: Subscription[] = [];
    cancelReason: string;
    conferencePhoneNumber: string;
    telephoneConferenceId: string;
    previousUrl: string = null;
    phoneDetails = '';

    constructor(
        private videoHearingService: VideoHearingsService,
        private bookingDetailsService: BookingDetailsService,
        private userIdentityService: UserIdentityService,
        private router: Router,
        private bookingService: BookingService,
        private bookingPersistService: BookingPersistService,
        private logger: Logger,
        private returnUrlService: ReturnUrlService
    ) {
        this.showCancelBooking = false;
        this.showConfirming = false;
        this.showConfirmingFailed = false;
    }

    async ngOnInit() {
        this.hearingId = this.bookingPersistService.selectedHearingId;
        if (this.hearingId) {
            const hearingDetailsResponse = await this.videoHearingService.getHearingById(this.hearingId).toPromise();
            this.mapHearing(hearingDetailsResponse);
            this.getConferencePhoneDetails();
            // mapping to Hearing model for edit on summary page
            this.booking = this.videoHearingService.mapHearingDetailsResponseToHearingModel(hearingDetailsResponse);
            this.setBookingInStorage();
            this.setTimeObserver();
            this.setSubscribers();
        }
        this.$subscriptions.push(
            this.userIdentityService.getUserInformation().subscribe(userProfile => {
                this.getUserRole(userProfile);
            })
        );
    }

    getUserRole(userProfile: UserProfileResponse) {
        this.isVhOfficerAdmin = userProfile && userProfile.is_vh_officer_administrator_role;
    }

    setSubscribers() {
        if (this.isConfirmationTimeValid) {
            this.timeSubscription = this.$timeObserver.subscribe(x => {
                this.setTimeObserver();
            });
        }
    }

    setTimeObserver() {
        if (this.booking) {
            let current = new Date();
            current.setMinutes(current.getMinutes() + 30);
            current = new Date(current);
            this.isConfirmationTimeValid = this.booking.scheduled_date_time.valueOf() >= current.valueOf();
            if (!this.isConfirmationTimeValid && this.timeSubscription) {
                this.timeSubscription.unsubscribe();
            }
        }
    }

    mapHearing(hearingResponse: HearingDetailsResponse) {
        this.hearing = this.bookingDetailsService.mapBooking(hearingResponse);
        const participants_and_judges = this.bookingDetailsService.mapBookingParticipants(hearingResponse);
        this.participants = participants_and_judges.participants;
        this.judges = participants_and_judges.judges;
        this.hearing.Endpoints = this.bookingDetailsService.mapBookingEndpoints(hearingResponse);
    }

    mapResponseToModel(hearingResponse: HearingDetailsResponse): HearingModel {
        return this.videoHearingService.mapHearingDetailsResponseToHearingModel(hearingResponse);
    }

    async navigateBack() {
        const returnUrl = this.returnUrlService.popUrl();
        if (returnUrl) {
            this.logger.debug(`${this.loggerPrefix} navigating back to ${returnUrl}`);
            await this.router.navigateByUrl(returnUrl);
        } else {
            this.logger.debug(`${this.loggerPrefix} navigating back to booking list`);
            await this.router.navigateByUrl(PageUrls.BookingsList);
        }
    }

    setBookingInStorage() {
        this.bookingService.resetEditMode();
        this.bookingService.setExistingCaseType(this.booking.case_type);
        this.videoHearingService.updateHearingRequest(this.booking);
    }

    editHearing() {
        this.router.navigate([PageUrls.Summary]);
    }

    cancelHearing() {
        this.showCancelBooking = true;
    }

    async confirmHearing() {
        if (this.isVhOfficerAdmin) {
            await this.updateHearingStatus(UpdateBookingStatus.Created, '');
        }
    }

    keepBooking() {
        this.showCancelBooking = false;
    }

    cancelBooking(cancelReason: string) {
        this.updateHearingStatus(UpdateBookingStatus.Cancelled, cancelReason);
    }

    async updateHearingStatus(status: UpdateBookingStatus, reason: string) {
        const updateBookingStatus = new UpdateBookingStatusRequest();
        updateBookingStatus.status = status;
        updateBookingStatus.updated_by = '';
        updateBookingStatus.cancel_reason = reason;
        this.showConfirming = true;

        try {
            this.logger.debug(`${this.loggerPrefix} Attempting to update hearing status`, { hearingId: this.hearingId, status: status });
            let updateBookingStatusResponse: UpdateBookingStatusResponse;

            updateBookingStatusResponse = await this.videoHearingService
                .updateBookingStatus(this.hearingId, updateBookingStatus)
                .toPromise();
            if (updateBookingStatusResponse.success) {
                this.logger.debug(`${this.loggerPrefix} Successfully updated hearing status`, {
                    hearingId: this.hearingId,
                    status: status
                });
                this.telephoneConferenceId = updateBookingStatusResponse.telephone_conference_id;
                this.conferencePhoneNumber = await this.videoHearingService.getConferencePhoneNumber();
                this.updateStatusHandler(status);
            } else {
                this.logger.debug(`${this.loggerPrefix} Failed to update hearing status`, {
                    hearingId: this.hearingId,
                    response: updateBookingStatusResponse
                });
                this.showConfirmingFailed = true;
                this.updateStatusHandler(UpdateBookingStatus.Failed);
            }

            this.showConfirming = false;
            this.logger.info(`${this.loggerPrefix} Hearing status changed`, { hearingId: this.hearingId, status: status });
            this.logger.event(`${this.loggerPrefix} Hearing status changed`, { hearingId: this.hearingId, status: status });
        } catch (error) {
            if (BookHearingException.isBookHearingException(error) && error.status > 500) {
                this.logger.info(`${this.loggerPrefix} Handling 500s`, { hearingId: this.hearingId, status: status });
                this.showConfirming = false;
                this.showConfirmingFailed = false;
                this.updateStatusHandler(UpdateBookingStatus.Created);
                return;
            }
            this.logger.error(`${this.loggerPrefix} Unexpected error during confirm process`, error, { hearingId: this.hearingId });
            this.errorHandler(error, status);
            this.updateStatusHandler(UpdateBookingStatus.Failed);
        }
    }

    updateStatusHandler(status: UpdateBookingStatus) {
        if (status === UpdateBookingStatus.Cancelled) {
            this.showCancelBooking = false;
        }
        this.persistStatus(status);
        this.$subscriptions.push(
            this.videoHearingService.getHearingById(this.hearingId).subscribe(
                newData => {
                    this.mapHearing(newData);
                },
                error => {
                    this.logger.error(`${this.loggerPrefix} Error to get hearing Id: ${this.hearingId}`, error);
                }
            )
        );
    }

    errorHandler(error, status: UpdateBookingStatus) {
        if (status === UpdateBookingStatus.Cancelled) {
            this.showCancelBooking = false;
        }

        this.showConfirming = false;
        this.showConfirmingFailed = true;

        this.logger.error(`${this.loggerPrefix} Error update hearing status`, error);
    }

    persistStatus(status: UpdateBookingStatus) {
        if (!this.booking) {
            this.booking = this.videoHearingService.getCurrentRequest();
        }
        this.booking.status = status;
        this.updateWithConferencePhoneDetails();
        this.setBookingInStorage();
    }

    closeConfirmFailed(): void {
        this.showConfirmingFailed = false;
    }

    ngOnDestroy() {
        if (this.timeSubscription) {
            this.timeSubscription.unsubscribe();
        }

        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }

    async getConferencePhoneDetails() {
        if (this.hearing.Status === 'Created') {
            try {
                const phoneResponse = await this.videoHearingService.getTelephoneConferenceId(this.hearingId).toPromise();
                this.telephoneConferenceId = phoneResponse.telephone_conference_id;
                this.conferencePhoneNumber = await this.videoHearingService.getConferencePhoneNumber();
                this.updateWithConferencePhoneDetails();
            } catch (error) {
                this.logger.warn(
                    `${this.loggerPrefix} Could not get conference phone Id , the hearing ${this.hearingId} is closed`,
                    error.title
                );
                this.phoneDetails = '';
            }
        }
    }

    updateWithConferencePhoneDetails() {
        if (this.telephoneConferenceId && this.conferencePhoneNumber) {
            this.booking.telephone_conference_id = this.telephoneConferenceId;
            this.hearing.TelephoneConferenceId = this.telephoneConferenceId;
            this.phoneDetails = `${this.conferencePhoneNumber} (ID: ${this.telephoneConferenceId})`;
        }
    }
}
