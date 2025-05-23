import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from '../../common/constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { BookingService } from '../../services/booking.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { RecordingGuardService } from '../../services/recording-guard.service';
import { OtherInformationModel } from '../../common/model/other-information.model';
import { PipeStringifierService } from 'src/app/services/pipe-stringifier.service';

@Component({
    selector: 'app-other-information',
    templateUrl: './other-information.component.html',
    styleUrls: ['./other-information.component.css'],
    standalone: false
})
export class OtherInformationComponent extends BookingBaseComponent implements OnInit {
    constants = Constants;
    hearing: VHBooking;
    attemptingCancellation = false;
    attemptingDiscardChanges = false;
    canNavigate = true;
    audioChoice: FormControl;

    otherInformationDetails: OtherInformationModel;

    audioRecording = true;
    switchOffRecording = false;
    disableAudioRecording = false;
    interpreterPresent = false;
    otherInformationText: string;
    otherInformation: FormControl;

    constructor(
        private readonly fb: FormBuilder,
        protected videoHearingService: VideoHearingsService,
        protected router: Router,
        protected bookingService: BookingService,
        protected logger: Logger,
        private readonly recordingGuard: RecordingGuardService,
        private readonly pipeStringifier: PipeStringifierService
    ) {
        super(bookingService, router, videoHearingService, logger);
    }

    ngOnInit() {
        this.checkForExistingRequest();
        this.switchOffRecording = !this.hearing.caseType.isAudioRecordingAllowed;
        this.interpreterPresent = this.recordingGuard.mandatoryRecordingForHearingRole(this.hearing.participants);
        this.initForm();
        super.ngOnInit();
    }

    private initForm() {
        this.audioRecording = this.setInitialAudio();
        this.audioChoice = new FormControl(this.audioRecording, Validators.required);

        this.otherInformation = new FormControl(
            this.otherInformationText ? this.otherInformationText : '',
            Validators.pattern(Constants.TextInputPattern)
        );

        this.form = this.fb.group({
            audioChoice: this.audioChoice,
            otherInformation: this.otherInformation
        });
    }

    get otherInformationInvalid() {
        return this.otherInformation.invalid && (this.otherInformation.dirty || this.otherInformation.touched);
    }

    private setInitialAudio() {
        if (this.switchOffRecording) {
            this.hearing.audioRecordingRequired = false;
            return false;
        }

        if (this.interpreterPresent) {
            this.hearing.audioRecordingRequired = true;
            return true;
        }

        return this.hearing?.audioRecordingRequired !== null && this.hearing?.audioRecordingRequired !== undefined
            ? this.hearing.audioRecordingRequired
            : true;
    }

    private checkForExistingRequest() {
        this.hearing = this.videoHearingService.getCurrentRequest();
        this.otherInformationDetails = OtherInformationModel.init(this.hearing.otherInformation);
        this.otherInformationText = this.otherInformationDetails.OtherInformation;
    }

    next() {
        this.hearing.audioRecordingRequired = this.audioChoice.value;
        this.otherInformationOnBlur();
        this.hearing.otherInformation = this.pipeStringifier.encode(this.otherInformationDetails);
        this.videoHearingService.updateHearingRequest(this.hearing);
        this.logger.debug(`${this.loggerPrefix} Updated audio recording status and hearing other information.`, { hearing: this.hearing });
        this.form.markAsPristine();
        if (this.editMode) {
            this.resetEditMode();
        }
        this.logger.debug(`${this.loggerPrefix} Proceeding to summary screen.`);
        this.router.navigate([PageUrls.Summary]);
    }

    cancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Cancelling booking and returning to dashboard.`);
        this.attemptingCancellation = false;
        this.videoHearingService.cancelRequest();
        this.form.reset();
        this.router.navigate([PageUrls.Dashboard]);
    }

    cancelChanges() {
        this.logger.debug(`${this.loggerPrefix} Resetting changes. Returning to summary.`);
        this.attemptingDiscardChanges = false;
        this.form.reset();
        this.navigateToSummary();
    }
    continueBooking() {
        this.logger.debug(`${this.loggerPrefix} Rejected cancellation. Continuing with booking.`);
        this.attemptingCancellation = false;
        this.attemptingDiscardChanges = false;
    }

    confirmCancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Attempting to cancel booking.`);
        if (this.editMode) {
            if (this.form.dirty || this.form.touched) {
                this.logger.debug(`${this.loggerPrefix} In edit mode. Changes found. Confirm if changes should be discarded.`);
                this.attemptingDiscardChanges = true;
            } else {
                this.logger.debug(`${this.loggerPrefix} In edit mode. No changes. Returning to summary.`);
                this.navigateToSummary();
            }
        } else {
            this.logger.debug(`${this.loggerPrefix} New booking. Changes found. Confirm if changes should be discarded.`);
            this.attemptingCancellation = true;
        }
    }

    otherInformationOnBlur() {
        this.otherInformationDetails.OtherInformation = this.otherInformation.value;
        const text = SanitizeInputText(this.otherInformation.value);
        this.otherInformation.setValue(text);
    }
}
