import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { interval, lastValueFrom, Subscription } from 'rxjs';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { JudiciaryParticipantDetailsModel } from 'src/app/common/model/judiciary-participant-details.model';
import { BookingDetailsService } from '../../services/booking-details.service';
import { BookingService } from '../../services/booking.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import {
    BookingStatus,
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
import { BookingStatusService } from 'src/app/services/booking-status-service';

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
    judicialMembers: Array<JudiciaryParticipantDetailsModel> = [];
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
    conferencePhoneNumberWelsh: string;
    telephoneConferenceId: string;
    previousUrl: string = null;
    phoneDetails = '';
    showCancelBookingFailed = false;

    constructor(
        private videoHearingService: VideoHearingsService,
        private bookingDetailsService: BookingDetailsService,
        private userIdentityService: UserIdentityService,
        private router: Router,
        private bookingService: BookingService,
        private bookingPersistService: BookingPersistService,
        private logger: Logger,
        private returnUrlService: ReturnUrlService,
        private bookingStatusService: BookingStatusService
    ) {
        this.showCancelBooking = false;
        this.showConfirming = false;
        this.showConfirmingFailed = false;
    }

    ngOnInit() {
        this.hearingId = this.bookingPersistService.selectedHearingId;
        if (this.hearingId) {
            lastValueFrom(this.videoHearingService.getHearingById(this.hearingId)).then(hearingDetailsResponse => {
                this.mapHearing(hearingDetailsResponse);
                this.getConferencePhoneDetails();
                // mapping to Hearing model for edit on summary page
                this.booking = this.videoHearingService.mapHearingDetailsResponseToHearingModel(hearingDetailsResponse);
                this.setBookingInStorage();
                this.setTimeObserver();
                this.setSubscribers();
            });
        }
        this.$subscriptions.push(
            this.userIdentityService.getUserInformation().subscribe({
                next: userProfile => this.getUserRole(userProfile)
            })
        );
    }

    closeCancelFailed() {
        this.showCancelBookingFailed = false;
    }

    getUserRole(userProfile: UserProfileResponse) {
        this.isVhOfficerAdmin = userProfile?.is_vh_officer_administrator_role;
    }

    setSubscribers() {
        if (this.isConfirmationTimeValid) {
            this.timeSubscription = this.$timeObserver.subscribe(() => {
                this.setTimeObserver();
            });
        }
    }

    setTimeObserver() {
        if (this.booking) {
            const endofday = new Date(this.booking.scheduled_date_time);
            endofday.setHours(23, 59);
            this.isConfirmationTimeValid = this.booking.scheduled_date_time.valueOf() <= endofday.valueOf();
            if (!this.isConfirmationTimeValid && this.timeSubscription) {
                this.timeSubscription.unsubscribe();
            }
        }
    }

    get canCancelHearing(): boolean {
        return !this.videoHearingService.isHearingAboutToStart();
    }

    get canEditHearing(): boolean {
        return !this.videoHearingService.isConferenceClosed();
    }

    get canRetryConfirmation(): boolean {
        if (!this.booking || this.booking.status !== BookingStatus.Failed) {
            return false;
        }
        const scheduledTime = moment(this.booking.scheduled_date_time);
        return scheduledTime.isAfter(moment(new Date()));
    }

    mapHearing(hearingResponse: HearingDetailsResponse) {
        this.hearing = this.bookingDetailsService.mapBooking(hearingResponse);
        const participants_and_judges = this.bookingDetailsService.mapBookingParticipants(hearingResponse);
        this.participants = participants_and_judges.participants;
        this.judges = participants_and_judges.judges;
        this.judicialMembers = participants_and_judges.judicialMembers;
        this.hearing.Endpoints = this.bookingDetailsService.mapBookingEndpoints(hearingResponse);
        this.videoHearingService
            .getAllocatedCsoForHearing(hearingResponse.id)
            .subscribe(
                response =>
                    (this.hearing.AllocatedTo = response.supports_work_allocation
                        ? response?.cso?.username ?? 'Not Allocated'
                        : 'Not Required')
            );
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
        this.bookingService.setEditMode();
        this.router.navigate([PageUrls.Summary]);
    }

    cancelHearing() {
        this.showCancelBooking = true;
    }

    async rebookHearing() {
        if (!this.isVhOfficerAdmin) {
            this.logger.warn(`${this.loggerPrefix} Cannot rebook hearing - user is not a Vh Officer Admin`);
            return;
        }

        this.showConfirming = true;
        const hearingId = this.hearingId;

        await this.videoHearingService.rebookHearing(hearingId);

        this.bookingStatusService.pollForStatus(hearingId).subscribe(async response => {
            let updateBookingStatus: UpdateBookingStatus = UpdateBookingStatus.Failed;
            if (response?.success) {
                updateBookingStatus = UpdateBookingStatus.Created;
            }
            await this.updateHearingStatusDisplay(response, updateBookingStatus);
        });
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
            const updateBookingStatusResponse = await lastValueFrom(
                this.videoHearingService.updateBookingStatus(this.hearingId, updateBookingStatus)
            );

            await this.updateHearingStatusDisplay(updateBookingStatusResponse, status);
        } catch (error) {
            if (status === UpdateBookingStatus.Cancelled) {
                this.showCancelBooking = false;
                this.showConfirming = false;
                this.showCancelBookingFailed = true;
                this.logger.error(`${this.loggerPrefix} Error to update to Cancelled hearing status`, error);
                return;
            }
            this.errorHandler(error, status);
            this.updateStatusHandler(UpdateBookingStatus.Failed);
        }
    }

    async updateHearingStatusDisplay(statusResponse: UpdateBookingStatusResponse, status: UpdateBookingStatus) {
        if (statusResponse.success) {
            this.telephoneConferenceId = statusResponse.telephone_conference_id;
            this.conferencePhoneNumber = await this.videoHearingService.getConferencePhoneNumber();
            this.conferencePhoneNumberWelsh = await this.videoHearingService.getConferencePhoneNumber(true);
            this.updateStatusHandler(status);
            this.booking.isConfirmed = true;
        } else {
            this.showConfirmingFailed = true;
            this.updateStatusHandler(UpdateBookingStatus.Failed);
        }

        this.showConfirming = false;
        this.logger.info(`${this.loggerPrefix} Hearing status changed`, { hearingId: this.hearingId, status: statusResponse });
        this.logger.event(`${this.loggerPrefix} Hearing status changed`, { hearingId: this.hearingId, status: statusResponse });
    }

    updateStatusHandler(status: UpdateBookingStatus) {
        if (status === UpdateBookingStatus.Cancelled) {
            this.showCancelBooking = false;
        }
        this.persistStatus(status);
        if (status === UpdateBookingStatus.Failed) {
            this.hearing.Status = status;
            return;
        }
        this.$subscriptions.push(
            this.videoHearingService.getHearingById(this.hearingId).subscribe({
                next: newData => {
                    this.mapHearing(newData);
                },
                error: error => {
                    this.logger.error(`${this.loggerPrefix} Error to get hearing Id: ${this.hearingId}`, error);
                }
            })
        );
        this.logger.info(`${this.loggerPrefix} updateStatusHandler --> Hearing status changed`, {
            hearingId: this.hearingId,
            status: status
        });
    }

    errorHandler(error, status: UpdateBookingStatus) {
        if (status === UpdateBookingStatus.Cancelled) {
            this.showCancelBooking = false;
        }
        this.showConfirmingFailed = true;
        this.showConfirming = false;
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
        if (this.hearing.Status === BookingStatus.Created) {
            try {
                await lastValueFrom(this.videoHearingService.getTelephoneConferenceId(this.hearingId)).then(phoneResponse => {
                    this.telephoneConferenceId = phoneResponse.telephone_conference_id;
                    this.videoHearingService.getConferencePhoneNumber().then(conferencePhoneNumber => {
                        this.conferencePhoneNumber = conferencePhoneNumber;
                        this.updateWithConferencePhoneDetails();
                    });
                    this.videoHearingService.getConferencePhoneNumber(true).then(conferencePhoneNumberWelsh => {
                        this.conferencePhoneNumberWelsh = conferencePhoneNumberWelsh;
                        this.updateWithConferencePhoneDetails();
                    });
                });
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
            this.phoneDetails = `ENG: ${this.conferencePhoneNumber} (ID: ${this.telephoneConferenceId})
CY: ${this.conferencePhoneNumberWelsh} (ID: ${this.telephoneConferenceId})`;
        }
    }

    get judgeExists(): boolean {
        return this.judges.length > 0;
    }
}
