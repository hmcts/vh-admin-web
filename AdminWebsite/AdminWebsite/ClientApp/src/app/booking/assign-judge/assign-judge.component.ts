import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { OtherInformationModel } from 'src/app/common/model/other-information.model';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { BookingService } from '../../services/booking.service';
import { JudgeResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { PipeStringifierService } from '../../services/pipe-stringifier.service';
import { EmailValidationService } from 'src/app/booking/services/email-validation.service';
import { ConfigService } from '../../services/config.service';
import { map } from 'rxjs/operators';
import { FeatureToggleService } from '../../services/feature-toggle.service';
@Component({
    selector: 'app-assign-judge',
    templateUrl: './assign-judge.component.html',
    styleUrls: ['./assign-judge.component.css']
})
export class AssignJudgeComponent extends BookingBaseComponent implements OnInit, OnDestroy {
    judgeLocator = 'judge-email';
    hearing: HearingModel;
    courtAccountJudgeEmail: string;
    judge: ParticipantModel;

    otherInformationDetails: OtherInformationModel;

    showAddStaffMemberFld: FormControl;
    isStaffMemberValid = false;
    staffMember: ParticipantModel;
    showStaffMemberErrorSummary = false;

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

    expanded = false;
    $subscriptions: Subscription[] = [];
    isJudgeParticipantError = false;

    invalidPattern: string;
    isValidEmail = true;
    showStaffMemberFeature: boolean;

    constructor(
        private fb: FormBuilder,
        protected router: Router,
        protected hearingService: VideoHearingsService,
        protected bookingService: BookingService,
        private pipeStringifier: PipeStringifierService,
        protected logger: Logger,
        private emailValidationService: EmailValidationService,
        private configService: ConfigService,
        private featureService: FeatureToggleService
    ) {
        super(bookingService, router, hearingService, logger);
    }

    static mapJudgeToModel(judge: JudgeResponse): ParticipantModel {
        const newParticipant = new ParticipantModel();
        newParticipant.title = 'Judge';
        newParticipant.first_name = judge.first_name;
        newParticipant.middle_names = '';
        newParticipant.last_name = judge.last_name;
        newParticipant.display_name = judge.display_name;
        newParticipant.email = judge.email;
        newParticipant.is_judge = true;
        newParticipant.phone = '';
        newParticipant.id = null;
        newParticipant.username = judge.email;
        newParticipant.case_role_name = 'Judge';
        newParticipant.hearing_role_name = 'Judge';
        return newParticipant;
    }

    ngOnInit() {
        this.failedSubmission = false;
        this.featureService.getFeatureToggles().subscribe(t => (this.showStaffMemberFeature = t.staff_member));

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
            validators: [Validators.required, Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)],
            updateOn: 'blur'
        });
        this.judgeEmailFld = new FormControl(this.otherInformationDetails.JudgeEmail, {
            validators: [Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)],
            updateOn: 'blur'
        });
        this.judgePhoneFld = new FormControl(this.otherInformationDetails.JudgePhone, {
            validators: [Validators.pattern(Constants.PhonePattern)],
            updateOn: 'blur'
        });
    }

    updateJudge(judge: ParticipantModel) {
        this.updateJudgeAttempted = true;
        this.judge = judge;
        this.canNavigate = false;
        this.isJudgeParticipantError = false;
        if (judge) {
            this.updateWithNewJudge(judge);
        } else {
            this.removeJudge();
        }

        this.hearing = { ...this.hearing };

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

    populateFormFields(existingJudge: ParticipantModel) {
        this.logger.debug(`${this.loggerPrefix} Found judge in hearing. Populating existing selection.`);
        this.judge = existingJudge;
        this.otherInformationDetails = OtherInformationModel.init(this.hearing.other_information);
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

    get isCourtroomAccount(): boolean {
        return this.judge.is_courtroom_account;
    }

    get displayEmailField(): boolean {
        return !!this.judge && !ParticipantModel.IsEmailEjud(this.judge.email);
    }

    changeDisplayName() {
        const text = SanitizeInputText(this.judgeDisplayNameFld.value);
        this.judgeDisplayNameFld.setValue(text);

        if (this.judge && this.judge.display_name) {
            const judge = this.hearing.participants.find(x => x.is_judge);
            if (judge) {
                this.hearing.participants.find(x => x.is_judge).display_name = this.judge.display_name;
            }
        }
    }

    changeEmail() {
        const judge = this.hearing.participants.find(x => x.is_judge);
        if (judge) {
            this.hearing.other_information = this.pipeStringifier.encode(this.otherInformationDetails);
        }
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

    changeIsStaffMemberValid(isValid: boolean) {
        this.isStaffMemberValid = isValid;
    }

    changeStaffMember(staffMember: ParticipantModel) {
        this.staffMember = staffMember;
        if (!this.showAddStaffMemberFld.value) {
            this.showAddStaffMemberFld.setValue(true);
        }
    }

    saveJudgeAndStaffMember() {
        this.logger.debug(`${this.loggerPrefix} Attempting to save judge (and staff member if selected).`);

        if (this.showAddStaffMemberFld.value === true && !this.isStaffMemberValid) {
            this.logger.warn(`${this.loggerPrefix} Validation errors are present when adding a staff member`);
            this.showStaffMemberErrorSummary = true;
            return;
        }

        if (!this.judge || !this.judge.email) {
            this.logger.warn(`${this.loggerPrefix} No judge selected. Email not found`);
            this.failedSubmission = true;
            return;
        }
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

            if (this.showAddStaffMemberFld.value === true && this.isStaffMemberValid) {
                const staffMemberIndex = this.hearing.participants.findIndex(
                    x => x.hearing_role_name === Constants.HearingRoles.StaffMember
                );

                if (staffMemberIndex > -1) {
                    this.hearing.participants[staffMemberIndex] = this.staffMember;
                } else {
                    this.hearing.participants.push(this.staffMember);
                }
            }

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
        this.$subscriptions.forEach(subcription => {
            if (subcription) {
                subcription.unsubscribe();
            }
        });
    }

    private removeJudge() {
        this.judgeDisplayNameFld.setValue('');
        this.judgeEmailFld.setValue('');
        this.judgePhoneFld.setValue('');
        this.hearing.participants = this.hearing.participants.filter(x => !x.is_judge);
    }

    private updateWithNewJudge(judge: ParticipantModel) {
        this.courtAccountJudgeEmail = judge.username;
        if (!this.isExistingJudge(judge)) {
            if (this.hearingService.canAddJudge(judge.username)) {
                judge.is_judge = true;
                judge.case_role_name = 'Judge';
                judge.hearing_role_name = 'Judge';
                this.hearing.participants = this.hearing.participants.filter(x => !x.is_judge);
                this.hearing.participants.unshift(judge);
                this.canNavigate = true;
            } else {
                this.isJudgeParticipantError = true;
            }
        }
    }

    private isExistingJudge(judge: ParticipantModel) {
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
