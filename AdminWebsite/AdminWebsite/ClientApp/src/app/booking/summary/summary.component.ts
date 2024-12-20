import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { HearingRoles } from 'src/app/common/model/hearing-roles.model';
import { RemoveInterpreterPopupComponent } from 'src/app/popups/remove-interpreter-popup/remove-interpreter-popup.component';
import { Constants } from '../../common/constants';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { BookingService } from '../../services/booking.service';
import {
    BookHearingException,
    BookingStatus,
    HearingDetailsResponse,
    MultiHearingRequest,
    ValidationProblemDetails
} from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { RecordingGuardService } from '../../services/recording-guard.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import { ParticipantListComponent } from '../participant';
import { ParticipantService } from '../services/participant.service';
import { OtherInformationModel } from '../../common/model/other-information.model';
import { finalize, takeUntil } from 'rxjs/operators';
import { BookingStatusService } from 'src/app/services/booking-status-service';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit, OnDestroy {
    protected readonly loggerPrefix: string = '[Booking] - [Summary] -';
    constants = Constants;
    hearing: VHBooking;
    attemptingCancellation: boolean;
    canNavigate = true;
    failedSubmission: boolean;
    bookingsSaving = false;
    otherInformation: OtherInformationModel;
    showConfirmationRemoveParticipant = false;
    selectedParticipantEmail: string;
    removerFullName: string;
    showWaitSaving = false;
    showErrorSaving: boolean;
    private readonly newHearingSessionKey = 'newHearingId';
    isExistingBooking = false;
    $subscriptions: Subscription[] = [];
    bookinConfirmed = false;
    switchOffRecording = false;
    endHearingDate: Date;
    hasParticipantsRequiringAudioRecording: boolean;

    @ViewChild(ParticipantListComponent, { static: true })
    participantsListComponent: ParticipantListComponent;
    showConfirmRemoveInterpretee = false;

    @ViewChild(RemovePopupComponent) removePopupComponent: RemovePopupComponent;
    @ViewChild(RemoveInterpreterPopupComponent) removeInterpreterPopupComponent: RemoveInterpreterPopupComponent;
    saveFailedMessages: string[];
    multiDayBookingEnhancementsEnabled: boolean;

    destroyed$ = new Subject<void>();
    bookingIsDegraded: boolean;

    constructor(
        private readonly hearingService: VideoHearingsService,
        private readonly router: Router,
        private readonly bookingService: BookingService,
        private readonly logger: Logger,
        private readonly recordingGuardService: RecordingGuardService,
        private readonly participantService: ParticipantService,
        private readonly featureService: LaunchDarklyService,
        private readonly bookingStatusService: BookingStatusService
    ) {
        this.attemptingCancellation = false;
        this.showErrorSaving = false;
    }

    ngOnInit() {
        this.logger.debug(`${this.loggerPrefix} On step Summary`, { step: 'Summary' });
        this.checkForExistingRequest();
        this.otherInformation = OtherInformationModel.init(this.hearing.otherInformation);
        this.retrieveHearingSummary();
        this.switchOffRecording = this.recordingGuardService.switchOffRecording(this.hearing.caseType);
        this.hasParticipantsRequiringAudioRecording = this.recordingGuardService.mandatoryRecordingForHearingRole(
            this.hearing.participants
        );
        this.hearing.audioRecordingRequired = this.isAudioRecordingRequired();
        this.retrieveHearingSummary();
        if (this.participantsListComponent) {
            this.participantsListComponent.isEditMode = this.isExistingBooking;
            this.$subscriptions.push(
                this.participantsListComponent.selectedParticipantToRemove.subscribe(participantEmail => {
                    this.selectedParticipantEmail = participantEmail;
                    this.confirmRemoveParticipant();
                })
            );
        }

        const multiDayBookingEnhancementsFlag$ = this.featureService
            .getFlag<boolean>(FeatureFlags.multiDayBookingEnhancements)
            .pipe(takeUntil(this.destroyed$));

        combineLatest([multiDayBookingEnhancementsFlag$]).subscribe(([multiDayBookingEnhancementsFlag]) => {
            this.multiDayBookingEnhancementsEnabled = multiDayBookingEnhancementsFlag;
            this.retrieveHearingSummary();
        });

        this.hearingService.isBookingServiceDegraded().subscribe({
            next: isDegraded => {
                this.bookingIsDegraded = isDegraded;
            },
            error: error => {
                this.logger.error(`${this.loggerPrefix} Failed to check if Bookings API is degraded.`, error);
            }
        });
    }

    private checkForExistingRequest() {
        this.hearing = this.hearingService.getCurrentRequest();
        this.isExistingBooking = this.hearing.hearingId && this.hearing.hearingId.length > 0;
        this.bookinConfirmed = this.hearing.status === 'Created';
    }

    isAudioRecordingRequired(): boolean {
        // CACD hearings should always have recordings set to off
        if (
            this.hearing.caseType === this.constants.CaseTypes.CourtOfAppealCriminalDivision ||
            this.hearing.caseType === this.constants.CaseTypes.CrimeCrownCourt
        ) {
            return false;
        }

        if (this.hasParticipantsRequiringAudioRecording) {
            return true;
        }
        return this.hearing.audioRecordingRequired;
    }

    private confirmRemoveParticipant() {
        const participant = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());

        if (participant) {
            const title = participant?.title ? `${participant.title}` : '';
            this.removerFullName = participant ? `${title} ${participant.firstName} ${participant.lastName}` : '';

            const isInterpretee =
                (participant.linkedParticipants &&
                    participant.linkedParticipants.length > 0 &&
                    participant.hearingRoleName.toLowerCase() !== HearingRoles.INTERPRETER) ||
                this.hearing.participants.some(p => p.interpreterFor === participant.email);
            if (isInterpretee) {
                this.showConfirmRemoveInterpretee = true;
            } else {
                this.showConfirmationRemoveParticipant = true;
            }
        }

        const judicalParticipant = this.hearing.judiciaryParticipants?.findIndex(x => x.email === this.selectedParticipantEmail);
        if (judicalParticipant > -1) {
            this.removerFullName = this.hearing.judiciaryParticipants[judicalParticipant].fullName;
            this.showConfirmationRemoveParticipant = true;
        }
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
            if (this.hearing.hearingId && this.hearing.participants[indexOfParticipant].id) {
                const id = this.hearing.participants[indexOfParticipant].id;
                this.logger.info(`${this.loggerPrefix} Participant removed from hearing.`, {
                    hearingId: this.hearing.hearingId,
                    participantId: id
                });
            }
            this.hearing.participants.splice(indexOfParticipant, 1);
            this.removeLinkedParticipant(this.selectedParticipantEmail);
            this.hearing = this.hearing.clone();
        }

        const judicalParticipant = this.hearing.judiciaryParticipants?.findIndex(x => x.email === this.selectedParticipantEmail);
        if (judicalParticipant > -1) {
            this.hearing.judiciaryParticipants.splice(judicalParticipant, 1);
            this.hearing = this.hearing.clone();
        }

        this.hearingService.updateHearingRequest(this.hearing);
        this.hearingService.setBookingHasChanged();
        this.bookingService.removeParticipantEmail();
    }

    private retrieveHearingSummary() {
        this.endHearingDate = this.hearing.endHearingDateTime;

        if (
            this.hearing.isMultiDayEdit &&
            this.multiDayBookingEnhancementsEnabled &&
            this.hearing.multiDayHearingLastDayScheduledDateTime
        ) {
            this.endHearingDate = this.hearing.multiDayHearingLastDayScheduledDateTime;
        }
    }

    get hasEndpoints(): boolean {
        return this.hearing.endpoints.length > 0;
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
        if (this.hearing.hearingId && this.hearing.hearingId.length > 0) {
            this.logger.info(`${this.loggerPrefix} Attempting to update an existing hearing.`, {
                hearingId: this.hearing.hearingId,
                caseName: this.hearing.case.name,
                caseNumber: this.hearing.case.number
            });
            if (this.hearing.isMultiDayEdit && this.multiDayBookingEnhancementsEnabled) {
                this.updateMultiDayHearing();
            } else {
                this.updateHearing();
            }
        } else {
            this.setDurationOfMultiHearing();
            try {
                this.logger.info(`${this.loggerPrefix} Attempting to book a new hearing.`, {
                    caseName: this.hearing.case.name,
                    caseNumber: this.hearing.case.number
                });

                const hearingDetailsResponse = await this.hearingService.saveHearing(this.hearing);

                if (this.hearing.judge) {
                    this.bookingStatusService.pollForStatus(hearingDetailsResponse.id).subscribe(async response => {
                        await this.processBooking(hearingDetailsResponse, response);
                    });
                } else {
                    await this.processMultiHearing(hearingDetailsResponse);
                    await this.postProcessBooking(hearingDetailsResponse);
                }
            } catch (error) {
                this.logger.error(`${this.loggerPrefix} Failed to save booking.`, error, { payload: this.hearing });
                this.setError(error);
            }
        }
    }

    async processMultiHearing(hearingDetailsResponse) {
        if (this.hearing.isMultiDayEdit) {
            this.logger.info(`${this.loggerPrefix} Hearing is multi-day`, {
                hearingId: hearingDetailsResponse.id,
                caseName: this.hearing.case.name,
                caseNumber: this.hearing.case.number
            });

            const isMultipleIndividualHearingDates = this.hearing.hearingDates && this.hearing.hearingDates.length > 1;
            const isHearingDateRange = !this.hearing.hearingDates || this.hearing.hearingDates.length === 0;

            if (isMultipleIndividualHearingDates) {
                this.logger.info(`${this.loggerPrefix} Hearing has multiple, individual days. Booking remaining days`, {
                    hearingId: hearingDetailsResponse.id,
                    caseName: this.hearing.case.name,
                    caseNumber: this.hearing.case.number
                });
                await this.hearingService.cloneMultiHearings(
                    hearingDetailsResponse.id,
                    new MultiHearingRequest({
                        hearing_dates: this.hearing.hearingDates.map(date => new Date(date)),
                        scheduled_duration: this.hearing.scheduledDuration
                    })
                );
            } else if (isHearingDateRange) {
                this.logger.info(`${this.loggerPrefix} Hearing has a range of days. Booking remaining days`, {
                    hearingId: hearingDetailsResponse.id,
                    caseName: this.hearing.case.name,
                    caseNumber: this.hearing.case.number
                });
                await this.hearingService.cloneMultiHearings(
                    hearingDetailsResponse.id,
                    new MultiHearingRequest({
                        start_date: new Date(this.hearing.scheduledDateTime),
                        end_date: new Date(this.hearing.endHearingDateTime),
                        scheduled_duration: this.hearing.scheduledDuration
                    })
                );
            } else {
                this.logger.info(`${this.loggerPrefix} Hearing has just one day, no remaining days to book`, {
                    hearingId: hearingDetailsResponse.id,
                    caseName: this.hearing.case.name,
                    caseNumber: this.hearing.case.number
                });
            }
        }
    }

    async processBooking(hearingDetailsResponse, hearingStatusResponse): Promise<void> {
        if (hearingStatusResponse?.success) {
            await this.processMultiHearing(hearingDetailsResponse);
        } else {
            await this.hearingService.updateFailedStatus(hearingDetailsResponse.id);
            this.setError(new Error(`Failed to book new hearing for ${hearingDetailsResponse.created_by} `));
        }
        await this.postProcessBooking(hearingDetailsResponse);
    }

    async postProcessBooking(hearingDetailsResponse: HearingDetailsResponse) {
        sessionStorage.setItem(this.newHearingSessionKey, hearingDetailsResponse.id);
        this.hearingService.cancelRequest();
        this.showWaitSaving = false;
        this.logger.info(`${this.loggerPrefix} Saved booking. Navigating to confirmation page.`, {
            hearingId: hearingDetailsResponse.id
        });
        await this.router.navigate([PageUrls.BookingConfirmation]);
    }

    private setDurationOfMultiHearing() {
        if (this.hearing.isMultiDayEdit && this.hearing.scheduledDuration === 0) {
            this.hearing.scheduledDuration = 480;
        }
    }

    updateHearing() {
        this.saveFailedMessages = null;
        this.$subscriptions.push(
            this.hearingService.updateHearing(this.hearing).subscribe({
                next: (hearingDetailsResponse: HearingDetailsResponse) => {
                    this.handleUpdateHearingSuccess(hearingDetailsResponse);
                },
                error: error => {
                    this.handleUpdateHearingError(error);
                }
            })
        );
    }

    updateMultiDayHearing() {
        this.saveFailedMessages = null;
        this.$subscriptions.push(
            this.hearingService.updateMultiDayHearing(this.hearing).subscribe({
                next: (hearingDetailsResponse: HearingDetailsResponse) => {
                    this.handleUpdateHearingSuccess(hearingDetailsResponse);
                },
                error: error => {
                    this.handleUpdateHearingError(error);
                }
            })
        );
    }

    private handleUpdateHearingSuccess(hearingDetailsResponse: HearingDetailsResponse) {
        const noJudgePrior =
            this.hearing.status === BookingStatus.BookedWithoutJudge || this.hearing.status === BookingStatus.ConfirmedWithoutJudge;
        this.showWaitSaving = false;
        this.hearingService.unsetBookingHasChanged();
        this.logger.info(`${this.loggerPrefix} Updated booking. Navigating to booking details.`, {
            hearingId: hearingDetailsResponse.id
        });

        if (hearingDetailsResponse.status === BookingStatus.Failed.toString()) {
            this.hearing.hearingId = hearingDetailsResponse.id;
            this.setError(new Error(`Failed to book new hearing for ${hearingDetailsResponse.created_by} `));
            return;
        }
        sessionStorage.setItem(this.newHearingSessionKey, hearingDetailsResponse.id);
        if (this.hearing.judge && noJudgePrior) {
            this.showWaitSaving = true;
            this.bookingStatusService
                .pollForStatus(hearingDetailsResponse.id)
                .pipe(
                    finalize(() => {
                        this.showWaitSaving = false;
                        this.router.navigate([PageUrls.BookingConfirmation]);
                    })
                )
                .subscribe();
        } else {
            this.router.navigate([PageUrls.BookingConfirmation]);
        }
    }

    private handleUpdateHearingError(error: any) {
        this.logger.error(`${this.loggerPrefix} Failed to update hearing with ID: ${this.hearing.hearingId}.`, error, {
            hearing: this.hearing.hearingId,
            payload: this.hearing
        });
        this.setError(error);
    }

    private setError(error: BookHearingException | Error) {
        if (BookHearingException.isBookHearingException(error) && error.result instanceof ValidationProblemDetails) {
            this.handleValidationProblem(error.result);
        }
        this.showWaitSaving = false;
        this.showErrorSaving = true;
    }

    private handleValidationProblem(validationErrors: ValidationProblemDetails) {
        this.saveFailedMessages = [];
        Object.keys(validationErrors.errors).forEach(key => {
            const messages = validationErrors.errors[key];
            this.saveFailedMessages.push(...messages);
        });
    }

    cancel(): void {
        this.showErrorSaving = false;
        this.bookingsSaving = false;
        this.saveFailedMessages = null;
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

        this.destroyed$.next();
        this.destroyed$.complete();
    }

    getDefenceAdvocateByContactEmail(defenceAdvocateConactEmail: string): string {
        let represents = '';
        const participant = this.hearing.participants.find(p => p.email === defenceAdvocateConactEmail);
        if (participant) {
            represents = participant.displayName + ', representing ' + participant.representee;
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
        const interpreterExists = this.hearing.linkedParticipants.find(p => p.participantEmail === email);
        const interpreteeExists = this.hearing.linkedParticipants.find(p => p.linkedParticipantEmail === email);
        if (interpreterExists || interpreteeExists) {
            this.hearing.linkedParticipants = [];
        }
    }

    private removeInterpreteeAndInterpreter() {
        const interpretee = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
        let interpreter: VHParticipant;
        if (interpretee.linkedParticipants && interpretee.linkedParticipants.length > 0) {
            interpreter = this.hearing.participants.find(i => i.id === interpretee.linkedParticipants[0].linkedParticipantId);
        } else {
            interpreter = this.hearing.participants.find(i => i.interpreterFor === this.selectedParticipantEmail);
        }
        if (interpreter) {
            this.participantService.removeParticipant(this.hearing, interpreter.email);
        }
        this.participantService.removeParticipant(this.hearing, this.selectedParticipantEmail);
        this.removeLinkedParticipant(this.selectedParticipantEmail);
        this.hearing = this.hearing.clone();
        this.hearingService.updateHearingRequest(this.hearing);
        this.hearingService.setBookingHasChanged();
        this.bookingService.removeParticipantEmail();
    }

    get canEdit() {
        return !this.hearingService.isConferenceClosed() && !this.hearingService.isHearingAboutToStart();
    }

    navToAddJudge() {
        this.router.navigate([PageUrls.AddJudicialOfficeHolders]);
    }

    get caseNumber(): string {
        return this.hearing.case.number;
    }

    get caseName(): string {
        return this.hearing.case.name;
    }
}
