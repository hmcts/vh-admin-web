import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { OtherInformationModel } from 'src/app/common/model/other-information.model';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { BookingService } from '../../services/booking.service';
import { Logger } from '../../services/logger';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { PipeStringifierService } from '../../services/pipe-stringifier.service';
import { EmailValidationService } from 'src/app/booking/services/email-validation.service';
import { ConfigService } from '../../services/config.service';
import { map } from 'rxjs/operators';
import { VHParticipant } from 'src/app/common/model/vh-participant';
@Component({
    selector: 'app-assign-judge',
    templateUrl: './assign-judge.component.html',
    styleUrls: ['./assign-judge.component.css']
})
export class AssignJudgeComponent extends BookingBaseComponent implements OnInit, OnDestroy {
    judgeLocator = 'judge-email';
    hearing: VHBooking;
    courtAccountJudgeEmail: string;
    judge: VHParticipant;
    otherInformationDetails: OtherInformationModel;
    showAddStaffMemberFld: FormControl;
    isStaffMemberExisting = false;
    judgeDisplayNameFld: FormControl;
    judgeEmailFld: FormControl;
    judgePhoneFld: FormControl;
    failedSubmission: boolean;
    attemptingCancellation = false;
    attemptingDiscardChanges = false;
    hasSaved: boolean;
    canNavigate = false;
    constants = Constants;
    updateJudgeAttempted = false;
    $subscriptions: Subscription[] = [];
    isJudgeParticipantError = false;
    isBookedHearing = false;
    invalidPattern: string;
    isValidEmail = true;
    showStaffMemberFeature: boolean;
    destroyed$ = new Subject<void>();

    constructor(
        private readonly fb: FormBuilder,
        protected router: Router,
        protected hearingService: VideoHearingsService,
        protected bookingService: BookingService,
        private readonly pipeStringifier: PipeStringifierService,
        protected logger: Logger,
        private readonly emailValidationService: EmailValidationService,
        private readonly configService: ConfigService
    ) {
        super(bookingService, router, hearingService, logger);
    }

    ngOnInit() {
        this.failedSubmission = false;
        this.checkForExistingRequest();
        this.initForm();

        const existingJudge = this.hearing.participants.find(x => x.is_judge);
        if (existingJudge != null) {
            this.updateJudge(existingJudge);
        }

        this.configService
            .getClientSettings()
            .pipe(map(x => x.test_username_stem))
            .subscribe(x => {
                this.invalidPattern = x;
            });

        super.ngOnInit();
    }

    private checkForExistingRequest() {
        this.logger.debug(`${this.loggerPrefix} Checking for existing hearing`);
        this.hearing = this.hearingService.getCurrentRequest();
        this.isBookedHearing = this.hearing?.hearing_id?.length > 0;
        this.isStaffMemberExisting = !!this.hearing?.participants.find(x => x.hearing_role_name === Constants.HearingRoles.StaffMember);
        this.otherInformationDetails = OtherInformationModel.init(this.hearing.other_information);
    }

    private initForm() {
        this.initFormFields();

        this.form = this.fb.group({
            showAddStaffMemberFld: this.showAddStaffMemberFld,
            judgeDisplayNameFld: this.judgeDisplayNameFld,
            judgeEmailFld: this.judgeEmailFld,
            judgePhoneFld: this.judgePhoneFld
        });

        this.setFieldSubscription();
    }

    private initFormFields() {
        const staffMemberExists = this.hearing?.participants.find(x => x.hearing_role_name === Constants.HearingRoles.StaffMember);

        this.showAddStaffMemberFld = new FormControl(!!staffMemberExists);
        this.judgeDisplayNameFld = new FormControl(this.judge?.display_name, {
            validators: [Validators.required, Validators.pattern(Constants.TextInputPatternDisplayName), Validators.maxLength(255)],
            updateOn: 'blur'
        });
        this.judgeEmailFld = new FormControl(this.otherInformationDetails.JudgeEmail ?? this.judge?.contact_email, {
            validators: [Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)],
            updateOn: 'blur'
        });
        this.judgePhoneFld = new FormControl(this.otherInformationDetails.JudgePhone, {
            validators: [Validators.pattern(Constants.PhonePattern)],
            updateOn: 'blur'
        });
    }

    updateJudge(judge: VHParticipant) {
        this.updateJudgeAttempted = true;
        this.judge = judge;
        this.canNavigate = false;
        this.isJudgeParticipantError = false;

        if (judge) {
            this.updateWithNewJudge(judge);
        } else {
            this.removeJudge();
        }

        this.hearing = this.hearing.clone();
        this.setTextFieldValues();
    }

    removeStaffMemberFromHearing() {
        const staffMemberIndex = this.hearing.participants.findIndex(x => x.hearing_role_name === Constants.HearingRoles.StaffMember);

        if (staffMemberIndex === -1) {
            this.logger.warn(
                `${this.loggerPrefix} Could NOT remove staff member as a participant with that hearing role name could not be found`,
                {
                    participants: this.hearing.participants
                }
            );
            return;
        }

        this.hearing.participants.splice(staffMemberIndex, 1);
        this.hearingService.updateHearingRequest(this.hearing);
    }

    setFieldSubscription() {
        this.$subscriptions.push(
            this.showAddStaffMemberFld.valueChanges.subscribe(show => {
                if (!show) {
                    this.removeStaffMemberFromHearing();
                }
            }),
            this.judgeDisplayNameFld.valueChanges.subscribe(name => {
                if (this.judge) {
                    this.judge.display_name = name;
                }
            }),
            this.judgeEmailFld.valueChanges.subscribe(email => {
                if (email === '') {
                    email = null;
                }
                this.otherInformationDetails.JudgeEmail = email;
                this.hearing.other_information = this.pipeStringifier.encode(this.otherInformationDetails);
            }),
            this.judgePhoneFld.valueChanges.subscribe(phone => {
                if (phone === '') {
                    phone = null;
                }
                this.otherInformationDetails.JudgePhone = phone;
                this.hearing.other_information = this.pipeStringifier.encode(this.otherInformationDetails);
            })
        );
    }

    get canNavigateNext() {
        const savedInCacheHearing = this.hearingService.getCurrentRequest();
        return this.canNavigate && savedInCacheHearing.participants.length > 0;
    }

    get isJudgeSelected(): boolean {
        return !!this.judge && !!this.judge.email;
    }

    get judgeDisplayNameInvalid(): boolean {
        return (
            this.judgeDisplayNameFld.invalid &&
            (this.judgeDisplayNameFld.dirty || this.judgeDisplayNameFld.touched || this.failedSubmission)
        );
    }

    get judgeEmailInvalid(): boolean {
        return this.judgeEmailFld.invalid && (this.judgeEmailFld.dirty || this.judgeEmailFld.touched || this.failedSubmission);
    }

    get judgePhoneInvalid(): boolean {
        return this.judgePhoneFld.invalid && (this.judgePhoneFld.dirty || this.judgePhoneFld.touched || this.failedSubmission);
    }

    get displayEmailField(): boolean {
        return !!this.judge && !this.judge.IsEmailEjud;
    }

    changeDisplayName() {
        const text = SanitizeInputText(this.judgeDisplayNameFld.value);
        this.judgeDisplayNameFld.setValue(text);

        if (this.judge?.display_name) {
            const judge = this.hearing.participants.find(x => x.is_judge);
            if (judge) {
                this.hearing.participants.find(x => x.is_judge).display_name = this.judge.display_name;
            }
        }
    }

    changeEmail() {
        const text = SanitizeInputText(this.judgeEmailFld.value);
        this.judgeEmailFld.setValue(text);

        this.isValidEmail = text
            ? this.emailValidationService.validateEmail(this.judgeEmailFld.value, this.invalidPattern) && this.judgeEmailFld.valid
            : true;
    }

    changeTelephone() {
        const judge = this.hearing.participants.find(x => x.is_judge);
        if (judge) {
            if (this.otherInformationDetails.JudgePhone) {
                this.hearing.other_information = this.pipeStringifier.encode(this.otherInformationDetails);
            }
        }
        const text = SanitizeInputText(this.judgePhoneFld.value);
        this.judgePhoneFld.setValue(text);
    }

    saveJudge() {
        this.logger.debug(`${this.loggerPrefix} Attempting to save judge.`);

        if (this.judge?.email) {
            if (!this.judge.display_name) {
                this.logger.warn(`${this.loggerPrefix} No judge selected. Display name not set.`);
                this.failedSubmission = true;
                return;
            }

            if (!this.hearingService.canAddJudge(this.judge.display_name)) {
                this.logger.warn(`${this.loggerPrefix} Judge could not be a panel member or winger in the same hearing.`);
                this.isJudgeParticipantError = true;
                this.failedSubmission = true;
                return;
            }
            if (this.form.valid && this.isValidEmail) {
                this.logger.debug(`${this.loggerPrefix} Judge selection valid.`);
                this.failedSubmission = false;
                this.form.markAsPristine();
                this.hasSaved = true;

                this.changeDisplayName();
                this.changeEmail();
                this.changeTelephone();

                this.hearingService.updateHearingRequest(this.hearing);

                this.logger.debug(`${this.loggerPrefix} Updated hearing judge and recording selection`, { hearing: this.hearing });
                if (this.editMode) {
                    this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary page.`);
                    this.router.navigate([PageUrls.Summary]);
                } else {
                    this.logger.debug(`${this.loggerPrefix} Navigating to add participants.`);
                    this.router.navigate([PageUrls.AddParticipants]);
                }
            } else {
                this.failedSubmission = true;
            }
        } else {
            this.logger.warn(`${this.loggerPrefix} No judge selected. Email not found`);
            this.failedSubmission = true;
        }
    }

    confirmCancelBooking() {
        this.logger.debug(`${this.loggerPrefix} Attempting to cancel booking.`);
        if (this.editMode) {
            if (this.form.dirty || this.form.touched) {
                this.logger.debug(`${this.loggerPrefix} In edit mode. Changes found. Confirm if changes should be discarded.`);
                this.attemptingDiscardChanges = true;
            } else {
                this.logger.debug(`${this.loggerPrefix} In edit mode. No changes. Returning to summary.`);
                this.router.navigate([PageUrls.Summary]);
            }
        } else {
            this.logger.debug(`${this.loggerPrefix} New booking. Changes found. Confirm if changes should be discarded.`);
            this.attemptingCancellation = true;
        }
    }

    continueBooking() {
        this.logger.debug(`${this.loggerPrefix} Rejected cancellation. Continuing with booking.`);
        this.attemptingCancellation = false;
        this.attemptingDiscardChanges = false;
    }

    cancelAssignJudge() {
        this.logger.debug(`${this.loggerPrefix} Cancelling booking and returning to dashboard.`);
        this.attemptingCancellation = false;
        this.form.reset();
        this.hearingService.cancelRequest();
        this.router.navigate([PageUrls.Dashboard]);
    }

    cancelChanges() {
        this.logger.debug(`${this.loggerPrefix} Resetting changes. Returning to summary.`);
        this.attemptingDiscardChanges = false;
        this.form.reset();
        this.navigateToSummary();
    }

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
    }

    ngOnDestroy() {
        this.bookingService.removeEditMode();
        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }

    private removeJudge() {
        this.judgeDisplayNameFld.setValue('');
        this.judgeEmailFld.setValue('');
        this.judgePhoneFld.setValue('');
        this.hearing.participants = this.hearing.participants.filter(x => !x.is_judge);
    }

    private updateWithNewJudge(judge: VHParticipant) {
        this.courtAccountJudgeEmail = judge.username;
        if (!this.isExistingJudge(judge)) {
            if (this.hearingService.canAddJudge(judge.username)) {
                judge.hearing_role_code = Constants.HearingRoleCodes.Judge;
                judge.hearing_role_name = 'Judge';
                this.hearing.participants = this.hearing.participants.filter(x => !x.is_judge);
                this.hearing.participants.unshift(judge);
                this.canNavigate = true;
            } else {
                this.isJudgeParticipantError = true;
            }
        }
    }

    private isExistingJudge(judge: VHParticipant) {
        return this.hearing.participants.find(participant => participant.is_judge)?.email === judge.email;
    }

    private setTextFieldValues() {
        if (this.isJudgeSelected) {
            this.judgeDisplayNameFld.setValue(this.judge.display_name);
            let judgeEmail = '';
            if (this.displayEmailField) {
                judgeEmail = this.otherInformationDetails.JudgeEmail;
            }
            this.judgeEmailFld.setValue(judgeEmail);
            this.judgePhoneFld.setValue(this.otherInformationDetails.JudgePhone);
        }
    }
}
