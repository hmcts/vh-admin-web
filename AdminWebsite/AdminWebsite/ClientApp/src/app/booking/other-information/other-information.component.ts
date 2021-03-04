import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from '../../common/constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { HearingModel } from '../../common/model/hearing.model';
import { BookingService } from '../../services/booking.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { RecordingGuardService } from '../../services/recording-guard.service';
import { OtherInformationModel } from '../../common/model/other-information.model';

@Component({
    selector: 'app-other-information',
    templateUrl: './other-information.component.html',
    styleUrls: ['./other-information.component.css']
})
export class OtherInformationComponent extends BookingBaseComponent implements OnInit {
    constants = Constants;
    hearing: HearingModel;
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
        private fb: FormBuilder,
        protected videoHearingService: VideoHearingsService,
        protected router: Router,
        protected bookingService: BookingService,
        protected logger: Logger,
        private recordingGuard: RecordingGuardService
    ) {
        super(bookingService, router, videoHearingService, logger);
    }

    ngOnInit() {
        this.checkForExistingRequest();
        this.otherInformationDetails = OtherInformationModel.init(this.hearing.other_information);
        this.otherInformationText = this.otherInformationDetails.otherInformation;
        this.switchOffRecording = this.recordingGuard.switchOffRecording(this.hearing.case_type);
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
            this.hearing.audio_recording_required = false;
            return false;
        }

        if (this.interpreterPresent) {
            this.hearing.audio_recording_required = true;
            return true;
        }

        return this.hearing && this.hearing.audio_recording_required !== null && this.hearing.audio_recording_required !== undefined
            ? this.hearing.audio_recording_required
            : true;
    }

    private checkForExistingRequest() {
        this.hearing = this.videoHearingService.getCurrentRequest();
        this.otherInformationText = this.hearing.other_information;
    }

    next() {
        this.hearing.audio_recording_required = this.audioChoice.value;
        this.otherInformationOnBlur();
        this.hearing.other_information = JSON.stringify(this.otherInformationDetails);
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
        this.otherInformationDetails.otherInformation = this.otherInformation.value;
        const text = SanitizeInputText(this.otherInformation.value);
        this.otherInformation.setValue(text);
    }
}
