import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingDetailsService } from '../../services/booking-details.service';
import { BookingService } from '../../services/booking.service';
import {
    HearingDetailsResponse,
    UpdateBookingStatusRequest,
    UpdateBookingStatus,
    UserProfileResponse
} from '../../services/clients/api-client';
import { UserIdentityService } from '../../services/user-identity.service';
import { HearingModel } from '../../common/model/hearing.model';
import { PageUrls } from '../../shared/page-url.constants';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { interval, Subscription } from 'rxjs';
import { Logger } from '../../services/logger';

@Component({
    selector: 'app-booking-details',
    templateUrl: 'booking-details.component.html',
    styleUrls: ['booking-details.component.css']
})
export class BookingDetailsComponent implements OnInit, OnDestroy {
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

    constructor(
        private videoHearingService: VideoHearingsService,
        private bookingDetailsService: BookingDetailsService,
        private userIdentityService: UserIdentityService,
        private router: Router,
        private bookingService: BookingService,
        private bookingPersistService: BookingPersistService,
        private logger: Logger
    ) {
        this.showCancelBooking = false;
        this.showConfirming = false;
        this.showConfirmingFailed = false;
    }

    ngOnInit() {
        this.hearingId = this.bookingPersistService.selectedHearingId;
        if (this.hearingId) {
            this.$subscriptions.push(
                this.videoHearingService.getHearingById(this.hearingId).subscribe((data) => {
                    this.mapHearing(data);
                    // mapping to Hearing model for edit on summary page
                    this.booking = this.videoHearingService.mapHearingDetailsResponseToHearingModel(data);
                    this.setBookingInStorage();
                    this.setTimeObserver();
                    this.setSubscribers();
                })
            );
        }
        this.$subscriptions.push(
            this.userIdentityService.getUserInformation().subscribe((userProfile) => {
                this.getUserRole(userProfile);
            })
        );
    }

    getUserRole(userProfile: UserProfileResponse) {
        this.isVhOfficerAdmin = userProfile && userProfile.is_vh_officer_administrator_role;
    }

    setSubscribers() {
        if (this.isConfirmationTimeValid) {
            this.timeSubscription = this.$timeObserver.subscribe((x) => {
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

    cancelHearing() {
        this.showCancelBooking = true;
    }

    confirmHearing() {
        if (this.isVhOfficerAdmin) {
            this.updateHearingStatus(UpdateBookingStatus.Created, '');
        }
    }

    keepBooking() {
        this.showCancelBooking = false;
    }

    cancelBooking(cancelReason: string) {
        this.updateHearingStatus(UpdateBookingStatus.Cancelled, cancelReason);
    }

    updateHearingStatus(status: UpdateBookingStatus, reason: string) {
        const updateBookingStatus = new UpdateBookingStatusRequest();
        updateBookingStatus.status = status;
        updateBookingStatus.updated_by = '';
        updateBookingStatus.cancel_reason = reason;
        this.showConfirming = true;

        this.$subscriptions.push(
            this.videoHearingService.updateBookingStatus(this.hearingId, updateBookingStatus).subscribe(
                (data) => {
                    if (data.success) {
                        this.updateStatusHandler(status);
                    } else {
                        this.showConfirmingFailed = true;
                        this.updateStatusHandler(UpdateBookingStatus.Failed);
                    }

                    this.showConfirming = false;
                    this.logger.event('Hearing status changed', { hearingId: this.hearingId, status: status });
                },
                (error) => {
                    this.errorHandler(error, status);
                    this.updateStatusHandler(UpdateBookingStatus.Failed);
                }
            )
        );
    }

    updateStatusHandler(status: UpdateBookingStatus) {
        if (status === UpdateBookingStatus.Cancelled) {
            this.showCancelBooking = false;
        }
        this.persistStatus(status);
        this.$subscriptions.push(
            this.videoHearingService.getHearingById(this.hearingId).subscribe(
                (newData) => {
                    this.mapHearing(newData);
                },
                (error) => {
                    this.logger.error(`Error to get hearing Id: ${this.hearingId}`, error);
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

        this.logger.error('Error update hearing status', error);
    }

    persistStatus(status: UpdateBookingStatus) {
        if (!this.booking) {
            this.booking = this.videoHearingService.getCurrentRequest();
        }
        this.booking.status = status;
        this.setBookingInStorage();
    }

    closeConfirmFailed(): void {
        this.showConfirmingFailed = false;
    }

    ngOnDestroy() {
        if (this.timeSubscription) {
            this.timeSubscription.unsubscribe();
        }

        this.$subscriptions.forEach((subscription) => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }
}
