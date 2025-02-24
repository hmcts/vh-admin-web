import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import moment from 'moment';
import { interval, lastValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { BookingService } from '../../services/booking.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { BookingStatus, HearingDetailsResponse, UpdateBookingStatusResponse, UserProfileResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import { BookingStatusService } from 'src/app/services/booking-status-service';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { mapHearingToVHBooking } from 'src/app/common/model/api-contract-to-client-model-mappers';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';

@Component({
    selector: 'app-booking-details',
    templateUrl: 'booking-details.component.html',
    styleUrls: ['booking-details.component.css'],
    standalone: false
})
export class BookingDetailsComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[BookingDetails] -';
    hearing: VHBooking;
    booking: VHBooking;
    participants: Array<VHParticipant> = [];
    judicialMembers: Array<JudicialMemberDto> = [];
    isVhOfficerAdmin = false;
    showCancelBooking: boolean;
    showConfirming: boolean;
    showConfirmingFailed: boolean;
    isConfirmationTimeValid = true;
    hearingId: string;

    $timeObserver = interval(60000);
    timeSubscription: Subscription;
    $subscriptions: Subscription[] = [];
    conferencePhoneNumber: string;
    conferencePhoneNumberWelsh: string;
    telephoneConferenceId: string;
    phoneDetails = '';
    showCancelBookingFailed = false;
    multiDayBookingEnhancementsEnabled: boolean;

    private readonly destroyed$ = new Subject<void>();

    constructor(
        private readonly videoHearingService: VideoHearingsService,
        private readonly userIdentityService: UserIdentityService,
        private readonly router: Router,
        private readonly bookingService: BookingService,
        private readonly bookingPersistService: BookingPersistService,
        private readonly logger: Logger,
        private readonly returnUrlService: ReturnUrlService,
        private readonly bookingStatusService: BookingStatusService,
        private readonly ldService: LaunchDarklyService
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
        this.ldService
            .getFlag<boolean>(FeatureFlags.multiDayBookingEnhancements)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(enabled => {
                this.multiDayBookingEnhancementsEnabled = enabled;
            });
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
            const endofday = new Date(this.booking.scheduledDateTime);
            endofday.setHours(23, 59);
            this.isConfirmationTimeValid = this.booking.scheduledDateTime.valueOf() <= endofday.valueOf();
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

    get isTotalHearingMoreThanThreshold(): boolean {
        return this.videoHearingService.isTotalHearingMoreThanThreshold();
    }

    get canRetryConfirmation(): boolean {
        if (!this.booking || this.booking.status !== BookingStatus.Failed) {
            return false;
        }
        const scheduledTime = moment(this.booking.scheduledDateTime);
        return scheduledTime.isAfter(moment(new Date()));
    }

    mapHearing(hearingResponse: HearingDetailsResponse) {
        this.hearing = mapHearingToVHBooking(hearingResponse);
        this.participants = this.hearing.participants;
        this.judicialMembers = this.hearing.judiciaryParticipants;
    }

    mapResponseToModel(hearingResponse: HearingDetailsResponse): VHBooking {
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
        this.bookingService.setExistingCaseType(this.booking.caseType.name);
        this.videoHearingService.updateHearingRequest(this.booking);
    }

    editHearing() {
        this.bookingService.setEditMode();
        this.setEditMultiDayHearingOptions(false);
        this.router.navigate([PageUrls.Summary]);
    }

    editMultiDaysOfHearing() {
        this.bookingService.setEditMode();
        this.setEditMultiDayHearingOptions(true);
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
            let updateBookingStatus: BookingStatus = BookingStatus.Failed;
            if (response?.success) {
                updateBookingStatus = BookingStatus.Created;
            }
            await this.updateHearingStatusDisplay(response, updateBookingStatus);
        });
    }

    setEditMultiDayHearingOptions(updateFutureDays: boolean) {
        this.booking.isMultiDayEdit = updateFutureDays; // Prevents the end date from showing in the UI when not updating future days
        this.videoHearingService.updateHearingRequest(this.booking);
    }

    keepBooking() {
        this.showCancelBooking = false;
    }

    async cancelSingleDayBooking(cancelReason: string) {
        await this.cancelBooking(cancelReason, false);
    }

    async cancelMultiDayBooking(cancelReason: string) {
        await this.cancelBooking(cancelReason, true);
    }

    async cancelBooking(cancelReason: string, isMultiDay: boolean) {
        this.showConfirming = true;
        try {
            let updateBookingStatusResponse: UpdateBookingStatusResponse;
            if (isMultiDay) {
                updateBookingStatusResponse = await lastValueFrom(
                    this.videoHearingService.cancelMultiDayBooking(this.hearingId, cancelReason, true)
                );
            } else {
                updateBookingStatusResponse = await lastValueFrom(this.videoHearingService.cancelBooking(this.hearingId, cancelReason));
            }
            await this.updateHearingStatusDisplay(updateBookingStatusResponse, BookingStatus.Cancelled);
        } catch (error) {
            this.showCancelBooking = false;
            this.showConfirming = false;
            this.showCancelBookingFailed = true;
            this.logger.error(`${this.loggerPrefix} Error to update to Cancelled hearing status`, error);
            return;
        }
    }

    async updateHearingStatusDisplay(statusResponse: UpdateBookingStatusResponse, status: BookingStatus) {
        if (statusResponse.success) {
            this.telephoneConferenceId = statusResponse.telephone_conference_id;
            this.conferencePhoneNumber = await this.videoHearingService.getConferencePhoneNumber();
            this.conferencePhoneNumberWelsh = await this.videoHearingService.getConferencePhoneNumber(true);
            this.updateStatusHandler(status);
            this.booking.isConfirmed = true;
        } else {
            this.showConfirmingFailed = true;
            this.updateStatusHandler(BookingStatus.Failed);
        }

        this.showConfirming = false;
        this.logger.info(`${this.loggerPrefix} Hearing status changed`, { hearingId: this.hearingId, status: statusResponse });
        this.logger.event(`${this.loggerPrefix} Hearing status changed`, { hearingId: this.hearingId, status: statusResponse });
    }

    updateStatusHandler(status: BookingStatus) {
        if (status === BookingStatus.Cancelled) {
            this.showCancelBooking = false;
        }
        this.persistStatus(status);
        if (status === BookingStatus.Failed) {
            this.hearing.status = status;
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

    errorHandler(error, status: BookingStatus) {
        if (status === BookingStatus.Cancelled) {
            this.showCancelBooking = false;
        }
        this.showConfirmingFailed = true;
        this.showConfirming = false;
        this.logger.error(`${this.loggerPrefix} Error update hearing status`, error);
    }

    persistStatus(status: BookingStatus) {
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

        this.destroyed$.next();
        this.destroyed$.complete();
    }

    async getConferencePhoneDetails() {
        if (this.hearing.status === BookingStatus.Created) {
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
            this.booking.telephoneConferenceId = this.telephoneConferenceId;
            this.hearing.telephoneConferenceId = this.telephoneConferenceId;
            this.phoneDetails = `ENG: ${this.conferencePhoneNumber} (ID: ${this.telephoneConferenceId})
CY: ${this.conferencePhoneNumberWelsh} (ID: ${this.telephoneConferenceId})`;
        }
    }

    get judgeExists(): boolean {
        return this.judicialMembers.some(j => j.isJudge);
    }

    isMultiDayUpdateAvailable(): boolean {
        return this.hearing.isMultiDay && this.multiDayBookingEnhancementsEnabled && !this.hearing.isLastDayOfMultiDayHearing;
    }
}
