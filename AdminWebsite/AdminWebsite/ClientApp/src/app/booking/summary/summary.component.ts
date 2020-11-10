import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { Constants } from '../../common/constants';
import { FormatShortDuration } from '../../common/formatters/format-short-duration';
import { HearingModel } from '../../common/model/hearing.model';
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { BookingService } from '../../services/booking.service';
import { HearingDetailsResponse, HearingTypeResponse, MultiHearingRequest } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { RecordingGuardService } from '../../services/recording-guard.service';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit, OnDestroy {
    protected readonly loggerPrefix: string = '[Booking] - [Summary] -';
    constants = Constants;
    hearing: HearingModel;
    attemptingCancellation: boolean;
    canNavigate = true;
    hearingForm: FormGroup;
    failedSubmission: boolean;
    bookingsSaving = false;
    caseNumber: string;
    caseName: string;
    caseHearingType: string;
    hearingDate: Date;
    courtRoomAddress: string;
    hearingDuration: string;
    otherInformation: string;
    audioChoice: string;
    errors: any;
    selectedHearingType: HearingTypeResponse[];
    showConfirmationRemoveParticipant = false;
    selectedParticipantEmail: string;
    removerFullName: string;
    showWaitSaving = false;
    showErrorSaving: boolean;
    private newHearingSessionKey = 'newHearingId';
    isExistingBooking = false;
    $subscriptions: Subscription[] = [];
    caseType: string;
    bookinConfirmed = false;
    endpoints: EndpointModel[] = [];
    switchOffRecording = false;
    hearingDetailsResponseMulti: HearingDetailsResponse;
    multiDays: boolean;
    endHearingDate: Date;

    @ViewChild(ParticipantsListComponent, { static: true })
    participantsListComponent: ParticipantsListComponent;

    @ViewChild(RemovePopupComponent) removePopupComponent: RemovePopupComponent;

    constructor(
        private hearingService: VideoHearingsService,
        private router: Router,
        private referenceDataService: ReferenceDataService,
        private bookingService: BookingService,
        private logger: Logger,
        private recordingGuardService: RecordingGuardService
    ) {
        this.attemptingCancellation = false;
        this.showErrorSaving = false;
    }

    ngOnInit() {
        this.logger.debug(`${this.loggerPrefix} On step Summary`, { step: 'Summary' });
        this.checkForExistingRequest();
        this.retrieveHearingSummary();
        this.switchOffRecording = this.recordingGuardService.switchOffRecording(this.hearing.case_type);
        if (this.participantsListComponent) {
            this.participantsListComponent.isEditMode = this.isExistingBooking;
            this.$subscriptions.push(
                this.participantsListComponent.selectedParticipantToRemove.subscribe(participantEmail => {
                    this.selectedParticipantEmail = participantEmail;
                    this.confirmRemoveParticipant();
                })
            );
        }
    }

    private checkForExistingRequest() {
        this.hearing = this.hearingService.getCurrentRequest();
        this.isExistingBooking = this.hearing.hearing_id && this.hearing.hearing_id.length > 0;
        this.bookinConfirmed = this.hearing.status === 'Created';
    }

    private confirmRemoveParticipant() {
        const participant = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
        const filteredParticipants = this.hearing.participants.filter(x => !x.is_judge);
        const isNotLast = filteredParticipants && filteredParticipants.length > 1;
        const title = participant && participant.title ? `${participant.title}` : '';
        this.removerFullName = participant ? `${title} ${participant.first_name} ${participant.last_name}` : '';
        this.showConfirmationRemoveParticipant = true;
        setTimeout(() => {
            this.removePopupComponent.isLastParticipant = !isNotLast;
        }, 500);
    }

    handleContinueRemove() {
        this.showConfirmationRemoveParticipant = false;
        this.removeParticipant();
    }

    handleCancelRemove() {
        this.logger.debug(`${this.loggerPrefix} Cancelling participant removal`);
        this.showConfirmationRemoveParticipant = false;
    }

    removeParticipant() {
        this.logger.debug(`${this.loggerPrefix} Removing participant`, { participant: this.selectedParticipantEmail });
        const indexOfParticipant = this.hearing.participants.findIndex(
            x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase()
        );
        if (indexOfParticipant > -1) {
            if (this.hearing.hearing_id && this.hearing.participants[indexOfParticipant].id) {
                const id = this.hearing.participants[indexOfParticipant].id;
                this.logger.info(`${this.loggerPrefix} Participant removed from hearing.`, {
                    hearingId: this.hearing.hearing_id,
                    participantId: id
                });
            }
            this.hearing.participants.splice(indexOfParticipant, 1);
            this.hearingService.updateHearingRequest(this.hearing);
            this.hearingService.setBookingHasChanged(true);
            this.bookingService.removeParticipantEmail();
            this.isLastParticipanRemoved();
        }
    }
    isLastParticipanRemoved() {
        const filteredParticipants = this.hearing.participants.filter(x => !x.is_judge);
        if (!filteredParticipants || filteredParticipants.length === 0) {
            // the last participant was removed, go to 'add participant' screen
            this.router.navigate([PageUrls.AddParticipants]);
        }
    }

    private retrieveHearingSummary() {
        this.caseNumber = this.hearing.cases.length > 0 ? this.hearing.cases[0].number : '';
        this.caseName = this.hearing.cases.length > 0 ? this.hearing.cases[0].name : '';
        this.caseHearingType = this.hearing.hearing_type_name;
        this.hearingDate = this.hearing.scheduled_date_time;
        this.hearingDuration = `listed for ${FormatShortDuration(this.hearing.scheduled_duration)}`;
        this.courtRoomAddress = this.formatCourtRoom(this.hearing.court_name, this.hearing.court_room);
        this.otherInformation = this.hearing.other_information;
        this.audioChoice = this.hearing.audio_recording_required ? 'Yes' : 'No';
        this.caseType = this.hearing.case_type;
        this.endpoints = this.hearing.endpoints;
        this.multiDays = this.hearing.multiDays;
        this.endHearingDate = this.hearing.end_hearing_date_time;
    }

    get hasEndpoints(): boolean {
        return this.endpoints.length > 0;
    }

    removeEndpoint(rowIndex: number): void {
        this.hearing.endpoints.splice(rowIndex, 1);
        this.hearingService.updateHearingRequest(this.hearing);
    }

    private formatCourtRoom(courtName, courtRoom) {
        const courtRoomText = courtRoom ? ', ' + courtRoom : '';
        return `${courtName}${courtRoomText}`;
    }

    continueBooking() {
        this.logger.debug(`${this.loggerPrefix} Rejected cancellation. Continuing with booking.`);
        this.attemptingCancellation = false;
    }

    confirmCancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Attempting to cancel booking.`);
        this.attemptingCancellation = true;
    }

    cancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Confirmed to cancel booking.`);
        this.attemptingCancellation = false;
        this.hearingService.cancelRequest();
        if (this.isExistingBooking) {
            this.logger.debug(`${this.loggerPrefix} Returning to booking details.`);
            this.router.navigate([PageUrls.BookingDetails]);
        } else {
            this.logger.debug(`${this.loggerPrefix} Returning to dashboard.`);
            this.router.navigate([PageUrls.Dashboard]);
        }
    }

    async bookHearing() {
        this.bookingsSaving = true;
        this.showWaitSaving = true;
        this.showErrorSaving = false;
        if (this.hearing.hearing_id && this.hearing.hearing_id.length > 0) {
            this.updateHearing();
        } else {
            this.setDurationOfMultiHearing();
            try {
                const hearingDetailsResponse = await this.hearingService.saveHearing(this.hearing);
                if (this.hearing.multiDays) {
                    await this.hearingService.cloneMultiHearings(
                        hearingDetailsResponse.id,
                        new MultiHearingRequest({
                            start_date: this.hearing.scheduled_date_time.toString(),
                            end_date: this.hearing.end_hearing_date_time.toString()
                        })
                    );
                }

                sessionStorage.setItem(this.newHearingSessionKey, hearingDetailsResponse.id);
                this.hearingService.cancelRequest();
                this.showWaitSaving = false;
                this.logger.info(`${this.loggerPrefix} Saved booking. Navigating to confirmation page.`, {
                    hearingId: hearingDetailsResponse.id
                });
                this.router.navigate([PageUrls.BookingConfirmation]);
            } catch (error) {
                this.logger.error(`${this.loggerPrefix} Failed to save booking.`, error, { payload: this.hearing });
                this.setError(error);
            }
        }
    }

    private setDurationOfMultiHearing() {
        if (this.hearing.multiDays) {
            this.hearing.scheduled_duration = 480;
        }
    }

    updateHearing() {
        this.$subscriptions.push(
            this.hearingService.updateHearing(this.hearing).subscribe(
                (hearingDetailsResponse: HearingDetailsResponse) => {
                    this.showWaitSaving = false;
                    this.hearingService.setBookingHasChanged(false);
                    this.logger.info(`${this.loggerPrefix} Updated booking. Navigating to booking details.`, {
                        hearingId: hearingDetailsResponse.id
                    });
                    this.router.navigate([PageUrls.BookingDetails]);
                },
                error => {
                    this.logger.error(`${this.loggerPrefix} Failed to update hearing with ID: ${this.hearing.hearing_id}.`, error, {
                        hearing: this.hearing.hearing_id,
                        payload: this.hearing
                    });
                    this.setError(error);
                }
            )
        );
    }

    private setError(error) {
        this.showWaitSaving = false;
        this.showErrorSaving = true;
        this.errors = error;
    }

    cancel(): void {
        this.showErrorSaving = false;
    }

    tryAgain(): void {
        this.showErrorSaving = true;
        this.bookHearing();
    }

    ngOnDestroy() {
        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }

    getParticipantInfo(defenceAdvocate: string): string {
        let represents = '';
        const participant = this.hearing.participants.find(p => p.id === defenceAdvocate);
        if (participant) {
            represents = participant.display_name + ', representing ' + participant.representee;
        }
        return represents;
    }
}
