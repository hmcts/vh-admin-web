import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { JudgeDataService } from 'src/app/booking/services/judge-data.service';
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

@Component({
    selector: 'app-assign-judge',
    templateUrl: './assign-judge.component.html',
    styleUrls: ['./assign-judge.component.css']
})
export class AssignJudgeComponent extends BookingBaseComponent implements OnInit, OnDestroy {
    hearing: HearingModel;
    courtAccountJudgeEmail: string;
    judge: JudgeResponse;

    otherInformationDetails: OtherInformationModel;

    judgeDisplayNameFld: FormControl;
    judgeEmailFld: FormControl;
    judgePhoneFld: FormControl;

    failedSubmission: boolean;
    attemptingCancellation = false;
    attemptingDiscardChanges = false;
    hasSaved: boolean;
    canNavigate = false;

    constants = Constants;
    availableJudges: JudgeResponse[];
    isJudgeSelected = true;
    expanded = false;
    $subscriptions: Subscription[] = [];
    isJudgeParticipantError = false;

    invalidPattern: string;
    isValidEmail = true;

    constructor(
        private fb: FormBuilder,
        protected router: Router,
        protected hearingService: VideoHearingsService,
        private judgeService: JudgeDataService,
        protected bookingService: BookingService,
        private pipeStringifier: PipeStringifierService,
        protected logger: Logger,
        private emailValidationService: EmailValidationService,
        private configService: ConfigService
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
        this.checkForExistingRequest();
        this.loadJudges();
        this.initForm();

        this.$subscriptions.push(
            this.configService
                .getClientSettings()
                .pipe(map(x => x.test_username_stem))
                .subscribe(x => (this.invalidPattern = x))
        );

        super.ngOnInit();
    }

    private checkForExistingRequest() {
        this.logger.debug(`${this.loggerPrefix} Checking for existing hearing`);
        this.hearing = this.hearingService.getCurrentRequest();
        this.otherInformationDetails = OtherInformationModel.init(this.hearing.other_information);
    }

    private initForm() {
        const existingJudge = this.hearing.participants.find(x => x.is_judge);

        this.populateFormFields(existingJudge);

        this.form = this.fb.group({
            judgeName: [this.judge.email, Validators.required],
            judgeDisplayNameFld: this.judgeDisplayNameFld,
            judgeEmailFld: this.judgeEmailFld,
            judgePhoneFld: this.judgePhoneFld
        });

        this.updateJudgeSummary();
    }

    updateJudgeSummary() {
        this.$subscriptions.push(
            this.judgeName.valueChanges.subscribe(judgeUserId => {
                this.addJudge(judgeUserId);
                this.isJudgeSelected = judgeUserId !== null;
                if (this.isJudgeSelected) {
                    this.judgeEmailFld.setValue(this.otherInformationDetails.JudgeEmail);
                    this.judgePhoneFld.setValue(this.otherInformationDetails.JudgePhone);
                    this.canNavigate = this.isJudgeSelected;
                }
            })
        );

        this.$subscriptions.push(
            this.judgeDisplayNameFld.valueChanges.subscribe(name => {
                this.judge.display_name = name;
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
        if (!existingJudge) {
            this.judge = new JudgeResponse({ email: this.constants.PleaseSelect, display_name: '' });
        } else {
            this.logger.debug(`${this.loggerPrefix} Found judge in hearing. Populating existing selection.`);
            this.judge = new JudgeResponse(existingJudge);
            this.otherInformationDetails = OtherInformationModel.init(this.hearing.other_information);
            this.canNavigate = true;
        }

        this.judgeDisplayNameFld = new FormControl(this.judge.display_name, {
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

    get canNavigateNext() {
        // should not navigate to next page if judge data is not saved in cache.
        const savedInCacheHearing = this.hearingService.getCurrentRequest();
        return this.canNavigate && savedInCacheHearing.participants.length > 0;
    }

    get judgeName() {
        return this.form.get('judgeName');
    }

    get judgeNameInvalid() {
        return this.judgeName.invalid && (this.judgeName.dirty || this.judgeName.touched || this.failedSubmission);
    }

    get judgeDisplayNameInvalid() {
        return (
            this.judgeDisplayNameFld.invalid &&
            (this.judgeDisplayNameFld.dirty || this.judgeDisplayNameFld.touched || this.failedSubmission)
        );
    }

    get judgeEmailInvalid() {
        return this.judgeEmailFld.invalid && (this.judgeEmailFld.dirty || this.judgeEmailFld.touched || this.failedSubmission);
    }

    get judgePhoneInvalid() {
        return this.judgePhoneFld.invalid && (this.judgePhoneFld.dirty || this.judgePhoneFld.touched || this.failedSubmission);
    }

    get isCourtroomAccount() {
        return !this.emailValidationService.hasCourtroomAccountPattern(this.judgeName.value, this.invalidPattern);
    }

    public addJudge(judgeEmail: string) {
        if (!judgeEmail) {
            return;
        }
        const selectedJudge = this.availableJudges.find(j => j.email === judgeEmail);
        if (!selectedJudge) {
            return;
        }
        this.judge.first_name = selectedJudge.first_name;
        this.judge.last_name = selectedJudge.last_name;
        this.judge.email = selectedJudge.email;
        this.courtAccountJudgeEmail = selectedJudge.email;
        if (!this.isJudgeDisplayNameSet()) {
            this.judge.display_name = selectedJudge.display_name;
        }
        this.judgeDisplayNameFld.setValue(this.judge.display_name);
        const newJudge = AssignJudgeComponent.mapJudgeToModel(this.judge);
        this.hearing.participants = this.hearing.participants.filter(x => !x.is_judge);
        this.hearing.participants.unshift(newJudge);
        this.hearing = Object.assign({}, this.hearing);
    }

    isJudgeDisplayNameSet(): boolean {
        let result = false;
        if (this.judge && this.judge.display_name) {
            const enteredJudge = this.availableJudges.find(j => j.display_name === this.judge.display_name);
            result = !enteredJudge;
        }
        return result;
    }

    changeDisplayName() {
        if (this.judge && this.judge.display_name) {
            const judge = this.hearing.participants.find(x => x.is_judge);
            if (judge) {
                this.hearing.participants.find(x => x.is_judge).display_name = this.judge.display_name;
            }
        }
        const text = SanitizeInputText(this.judgeDisplayNameFld.value);
        this.judgeDisplayNameFld.setValue(text);
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

    saveJudge() {
        this.logger.debug(`${this.loggerPrefix} Attempting to save judge.`);
        if (!this.judge.email || this.judge.email === this.constants.PleaseSelect) {
            this.logger.warn(`${this.loggerPrefix} No judge selected. Email not found`);
            this.isJudgeSelected = false;
            return;
        }
        if (!this.judge.display_name) {
            this.logger.warn(`${this.loggerPrefix} No judge selected. Display name not set.`);
            this.failedSubmission = true;
            return;
        }

        if (!this.validateJudgeAndJohMembers()) {
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

    private loadJudges() {
        if (this.availableJudges) {
            return;
        }
        this.logger.debug(`${this.loggerPrefix} Attempting to get list of judges`);
        this.$subscriptions.push(
            this.judgeService.getJudges().subscribe(
                (data: JudgeResponse[]) => {
                    this.availableJudges = data.filter(x => x.first_name && x.last_name);
                    this.logger.debug(`${this.loggerPrefix} Got list of judges`, { availableJudges: this.availableJudges.length });
                    const userResponse = new JudgeResponse();
                    userResponse.email = this.constants.PleaseSelect;
                    userResponse.display_name = '';
                    this.availableJudges.unshift(userResponse);
                    this.initForm();
                },
                error => this.onErrorLoadJudges(error)
            )
        );
    }

    onErrorLoadJudges(error) {
        this.logger.error(`${this.loggerPrefix} Error to get list of judges.`, error);
    }

    toggle() {
        this.expanded = !this.expanded;
    }

    validateJudgeAndJohMembers(): boolean {
        if (this.hearing?.participants.length && this.judgeName.value) {
            return !this.hearing.participants.some(
                x => (x.hearing_role_name === 'Panel Member' || x.hearing_role_name === 'Winger') && x.username === this.judgeName.value
            );
        }

        return true;
    }

    ngOnDestroy() {
        this.bookingService.removeEditMode();
        this.$subscriptions.forEach(subcription => {
            if (subcription) {
                subcription.unsubscribe();
            }
        });
    }
}
