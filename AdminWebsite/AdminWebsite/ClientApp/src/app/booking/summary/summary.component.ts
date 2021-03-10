import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingRoles } from 'src/app/common/model/hearing-roles.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { RemoveInterpreterPopupComponent } from 'src/app/popups/remove-interpreter-popup/remove-interpreter-popup.component';
import { Constants } from '../../common/constants';
import { FormatShortDuration } from '../../common/formatters/format-short-duration';
import { HearingModel } from '../../common/model/hearing.model';
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { BookingService } from '../../services/booking.service';
import { HearingDetailsResponse, MultiHearingRequest } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { RecordingGuardService } from '../../services/recording-guard.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import { ParticipantListComponent } from '../participant';
import { ParticipantService } from '../services/participant.service';
import { OtherInformationModel } from '../../common/model/other-information.model';

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
    failedSubmission: boolean;
    bookingsSaving = false;
    caseNumber: string;
    caseName: string;
    caseHearingType: string;
    hearingDate: Date;
    courtRoomAddress: string;
    hearingDuration: string;
    otherInformation: OtherInformationModel;
    audioChoice: string;
    errors: any;
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

    groupedHearingDates = {};

    @ViewChild(ParticipantListComponent, { static: true })
    participantsListComponent: ParticipantListComponent;
    showConfirmRemoveInterpretee = false;

    @ViewChild(RemovePopupComponent) removePopupComponent: RemovePopupComponent;
    @ViewChild(RemoveInterpreterPopupComponent) removeInterpreterPopupComponent: RemoveInterpreterPopupComponent;

    constructor(
        private hearingService: VideoHearingsService,
        private router: Router,
        private bookingService: BookingService,
        private logger: Logger,
        private recordingGuardService: RecordingGuardService,
        private participantService: ParticipantService
    ) {
        this.attemptingCancellation = false;
        this.showErrorSaving = false;
    }

    ngOnInit() {
        this.logger.debug(`${this.loggerPrefix} On step Summary`, { step: 'Summary' });
        this.checkForExistingRequest();
        this.otherInformation = OtherInformationModel.init(this.hearing.other_information);
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

        const hearingDates = this.hearing.hearing_dates.map(x => new Date(x));
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        this.groupedHearingDates = hearingDates.reduce((a, c) => {
            const monthIndex = c.getMonth();
            const year = c.getFullYear();
            const monthName = months[monthIndex];
            const monthYear = `${monthName} ${year}`;
            if (!a[monthYear]) {
                a[monthYear] = hearingDates.filter(date => date.getMonth() === monthIndex && date.getFullYear() === year);
            }
            return a;
        }, {});
    }

    get groupedHearingDateMonthsYears() {
        return Object.keys(this.groupedHearingDates);
    }

    hearingDatesForMonth(key: string) {
        return this.groupedHearingDates[key];
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

        const isInterpretee =
            (participant.linked_participants &&
                participant.linked_participants.length > 0 &&
                participant.hearing_role_name.toLowerCase() !== HearingRoles.INTERPRETER) ||
            this.hearing.participants.some(p => p.interpreterFor === participant.email);
        if (isInterpretee) {
            this.showConfirmRemoveInterpretee = true;
        } else {
            this.showConfirmationRemoveParticipant = true;
        }
        setTimeout(() => {
            if (isInterpretee) {
                this.removeInterpreterPopupComponent.isLastParticipant = !isNotLast;
            } else {
                this.removePopupComponent.isLastParticipant = !isNotLast;
            }
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

            this.removeLinkedParticipant(this.selectedParticipantEmail);

            this.hearing.participants = [...this.hearing.participants];

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
            this.logger.info(`${this.loggerPrefix} Attempting to update an existing hearing.`, {
                hearingId: this.hearing.hearing_id,
                caseName: this.hearing.cases[0].name,
                caseNumber: this.hearing.cases[0].number
            });
            this.updateHearing();
        } else {
            this.setDurationOfMultiHearing();
            try {
                this.logger.info(`${this.loggerPrefix} Attempting to book a new hearing.`, {
                    caseName: this.hearing.cases[0].name,
                    caseNumber: this.hearing.cases[0].number
                });
                const hearingDetailsResponse = await this.hearingService.saveHearing(this.hearing);
                if (this.hearing.multiDays) {
                    this.logger.info(`${this.loggerPrefix} Hearing is a multi-day. Booking remaining days`, {
                        hearingId: hearingDetailsResponse.id,
                        caseName: this.hearing.cases[0].name,
                        caseNumber: this.hearing.cases[0].number
                    });
                    if (this.hearing.hearing_dates) {
                        await this.hearingService.cloneMultiHearings(
                            hearingDetailsResponse.id,
                            new MultiHearingRequest({
                                hearing_dates: this.hearing.hearing_dates.map(date => new Date(date))
                            })
                        );
                    } else {
                        await this.hearingService.cloneMultiHearings(
                            hearingDetailsResponse.id,
                            new MultiHearingRequest({
                                start_date: new Date(this.hearing.scheduled_date_time),
                                end_date: new Date(this.hearing.end_hearing_date_time)
                            })
                        );
                    }
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

    handleContinueRemoveInterpreter() {
        this.showConfirmRemoveInterpretee = false;
        this.removeInterpreteeAndInterpreter();
    }
    handleCancelRemoveInterpreter() {
        this.showConfirmRemoveInterpretee = false;
    }
    private removeLinkedParticipant(email: string): void {
        // removes both the linked participants.
        const interpreterExists = this.hearing.linked_participants.find(p => p.participantEmail === email);
        const interpreteeExists = this.hearing.linked_participants.find(p => p.linkedParticipantEmail === email);
        if (interpreterExists || interpreteeExists) {
            this.hearing.linked_participants = [];
        }
    }
    private removeInterpreteeAndInterpreter() {
        const interpretee = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
        let interpreter: ParticipantModel;
        if (interpretee.linked_participants && interpretee.linked_participants.length > 0) {
            interpreter = this.hearing.participants.find(i => i.id === interpretee.linked_participants[0].linkedParticipantId);
        } else {
            interpreter = this.hearing.participants.find(i => i.interpreterFor === this.selectedParticipantEmail);
        }
        if (interpreter) {
            this.participantService.removeParticipant(this.hearing, interpreter.email);
        }
        this.participantService.removeParticipant(this.hearing, this.selectedParticipantEmail);
        this.removeLinkedParticipant(this.selectedParticipantEmail);
        this.hearingService.updateHearingRequest(this.hearing);
        this.hearingService.setBookingHasChanged(true);
        this.bookingService.removeParticipantEmail();
        this.isLastParticipanRemoved();
    }
}
