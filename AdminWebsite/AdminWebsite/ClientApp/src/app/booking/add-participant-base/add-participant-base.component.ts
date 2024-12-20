import { Directive, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { HearingRoles } from 'src/app/common/model/hearing-roles.model';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { HearingRoleModel } from 'src/app/common/model/hearing-role.model';
import { InterpreterFormComponent } from '../interpreter-form/interpreter-form.component';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Directive()
export abstract class AddParticipantBaseDirective extends BookingBaseComponent implements OnInit {
    isShowErrorSummary = false;
    hearingRoles: HearingRoleModel[] = [];

    participantDetails: VHParticipant;
    existingParticipant: boolean;
    existingPersonEmails: string[] = [];
    interpreterSelected = false;
    displayErrorNoParticipants = false;
    isRepresentative = false;
    hearingRoleList: string[];
    isRoleSelected = true;
    isPartySelected = true;
    isInterpreter = false;
    representeeLabelText: string;
    representeeErrorMessage: string;

    hearing: VHBooking;

    displayNextButton = true;
    displayAddButton = false;
    displayClearButton = false;
    displayUpdateButton = false;

    errorAlternativeEmail = false;
    errorJohAccountNotFound = false;
    errorJudiciaryAccount = false;

    showDetails = false;
    emailDisabled = false;
    companyName: FormControl;
    companyNameIndividual: FormControl;
    displayName: FormControl;
    email: FormControl;
    firstName: FormControl;
    role: FormControl;
    interpreterFor: FormControl;
    lastName: FormControl;
    phone: FormControl;
    representing: FormControl;
    title: FormControl;

    interpreterEnhancementsFlag = false;

    public judiciaryRoles = Constants.JudiciaryRoles;

    protected constants = Constants;

    @ViewChild(SearchEmailComponent) searchEmail: SearchEmailComponent;
    @ViewChild(InterpreterFormComponent, { static: false }) interpreterForm: InterpreterFormComponent;

    constructor(
        protected bookingService: BookingService,
        protected router: Router,
        protected videoHearingService: VideoHearingsService,
        protected logger: Logger
    ) {
        super(bookingService, router, videoHearingService, logger);
    }

    get firstNameInvalid() {
        return this.firstName.invalid && (this.firstName.dirty || this.firstName.touched || this.isShowErrorSummary);
    }

    get lastNameInvalid() {
        return this.lastName.invalid && (this.lastName.dirty || this.lastName.touched || this.isShowErrorSummary);
    }

    get phoneInvalid() {
        return this.phone.invalid && (this.phone.dirty || this.phone.touched || this.isShowErrorSummary);
    }

    get roleInvalid() {
        return this.role.invalid && (this.role.dirty || this.role.touched || this.isShowErrorSummary);
    }

    get displayNameInvalid() {
        return (
            (this.displayName.invalid && (this.displayName.dirty || this.displayName.touched || this.isShowErrorSummary)) ||
            (this.displayName.touched && this.displayName.value === '')
        );
    }

    get representeeInvalid() {
        return this.representing.invalid && (this.representing.dirty || this.representing.touched || this.isShowErrorSummary);
    }

    get companyInvalid() {
        return this.companyName.invalid && (this.companyName.dirty || this.companyName.touched || this.isShowErrorSummary);
    }

    get companyIndividualInvalid() {
        return (
            this.companyNameIndividual.invalid &&
            (this.companyNameIndividual.dirty || this.companyNameIndividual.touched || this.isShowErrorSummary)
        );
    }

    initialiseForm() {
        this.role = new FormControl(this.constants.PleaseSelect, [
            Validators.required,
            Validators.pattern(this.constants.PleaseSelectPattern)
        ]);
        this.title = new FormControl(this.constants.PleaseSelect);
        this.firstName = new FormControl('', [
            Validators.required,
            Validators.pattern(Constants.TextInputPatternName),
            Validators.maxLength(255)
        ]);
        this.lastName = new FormControl('', [
            Validators.required,
            Validators.pattern(Constants.TextInputPatternName),
            Validators.maxLength(255)
        ]);
        this.email = new FormControl('', [Validators.required, Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)]);
        this.phone = new FormControl('', [Validators.pattern(Constants.PhonePattern)]);
        this.displayName = new FormControl('', [
            Validators.required,
            Validators.pattern(Constants.TextInputPatternDisplayName),
            Validators.maxLength(255)
        ]);
        this.companyName = new FormControl('');
        this.companyNameIndividual = new FormControl('', [Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]);
        this.representing = new FormControl('', [Validators.pattern(Constants.TextInputPattern), Validators.maxLength(255)]);
        this.interpreterFor = new FormControl(this.constants.PleaseSelect, [
            Validators.required,
            Validators.pattern(this.constants.PleaseSelectPattern)
        ]);

        this.form = new FormGroup({
            role: this.role,
            title: this.title,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
            displayName: this.displayName,
            companyName: this.companyName,
            companyNameIndividual: this.companyNameIndividual,
            representing: this.representing,
            interpreterFor: this.interpreterFor
        });
    }

    emailChanged() {
        if (!this.validateJudgeAndJohMembers()) {
            this.searchEmail.isErrorEmailAssignedToJudge = true;
            this.errorAlternativeEmail = true;
            this.errorJohAccountNotFound = false;
            return;
        }
        this.errorAlternativeEmail = false;
        this.errorJohAccountNotFound = false;

        this.email.setValue(this.searchEmail.email);

        if (this.form.valid && this.validEmail()) {
            this.disableCaseAndHearingRoles();
            this.displayAdd();
        }
    }

    validEmail() {
        return this.showDetails && this.searchEmail ? this.searchEmail.validateEmail() : true;
    }
    validateJudgeAndJohMembers(): boolean {
        if (this.hearing?.participants.length) {
            const judge = this.hearing.participants.find(x => x.isJudge);
            return this.searchEmail?.email !== judge?.username;
        }
        return true;
    }

    public getParticipant(participantDetails: VHParticipant) {
        if (!this.validateJudgeAndJohMembers()) {
            this.searchEmail.isErrorEmailAssignedToJudge = true;
            this.errorAlternativeEmail = true;
            return;
        }
        this.errorAlternativeEmail = false;
        this.errorJohAccountNotFound = false;
        this.displayErrorNoParticipants = false;
        this.displayAdd();
        this.enableFields();
        this.participantDetails = this.participantDetails.clone();

        if (participantDetails.isExistPerson) {
            this.disableLastFirstNames();
            this.emailDisabled = true;
            this.existingPersonEmails.push(participantDetails.email);
        }
        this.existingParticipant = participantDetails.id && participantDetails.id.length > 0;
        if (this.existingParticipant) {
            this.disableCaseAndHearingRoles();
            this.disableLastFirstNames();
        }
        // if it's added in the existing hearing participant, then allowed all fields to edit.
        this.resetPartyAndRole();
        this.isRepresentative = this.isRoleRepresentative(this.participantDetails.hearingRoleName);
        const formControlsObj = {
            role: this.participantDetails.hearingRoleName,
            title: this.participantDetails.title ?? this.constants.PleaseSelect,
            firstName: this.participantDetails.firstName?.trim(),
            lastName: this.participantDetails.lastName?.trim(),
            email: this.participantDetails.email?.trim() || '',
            phone: this.participantDetails.phone?.trim() || '',
            displayName: this.participantDetails.display_Name?.trim() || '',
            companyName: this.participantDetails.company?.trim() || '',
            companyNameIndividual: this.participantDetails.company?.trim() || '',
            representing: this.participantDetails.representee?.trim() || '',
            interpreterFor: this.setInterpretee(this.participantDetails)?.trim() || this.constants.PleaseSelect
        };
        if (this.participantDetails.hearingRoleName === Constants.HearingRoles.StaffMember) {
            delete formControlsObj['interpreterFor'];
        }
        this.form.setValue(formControlsObj);
        (<any>Object).values(this.form.controls).forEach(control => {
            control.markAsTouched();
            control.markAsDirty();
        });

        setTimeout(() => {
            this.form.get('role').setValue(this.participantDetails.hearingRoleName);
            this.roleSelected();

            if (this.participantDetails?.interpretation_language) {
                this.interpreterForm.prepopulateForm(this.participantDetails.interpretation_language);
            }
        }, 500);
    }

    protected disableCaseAndHearingRoles() {
        this.form.get('role').disable();
    }

    protected displayAdd() {
        this.displayNextButton = false;
        this.displayClearButton = true;
        this.displayAddButton = true;
        this.displayUpdateButton = false;
    }

    protected displayNext() {
        this.displayNextButton = true;
        this.displayClearButton = false;
        this.displayAddButton = false;
        this.displayUpdateButton = false;
    }

    protected disableLastFirstNames() {
        this.form.get('lastName').disable();
        this.form.get('firstName').disable();
    }

    enableFields() {
        this.emailDisabled = false;
        this.form.get('lastName').enable();
        this.form.get('firstName').enable();
        this.form.get('role').enable();
    }

    resetPartyAndRole() {
        if (
            this.isRoleSelected &&
            !this.existingParticipant &&
            (!this.participantDetails.hearingRoleName || this.participantDetails.hearingRoleName.length === 0)
        ) {
            this.participantDetails.hearingRoleName = this.role.value;
        }
    }

    setupHearingRolesWithoutCaseRole() {
        this.hearingRoleList = this.hearingRoles ? this.hearingRoles.map(x => x.name) : [];
        this.updateHearingRoleList(this.hearingRoleList);
        if (!this.hearingRoleList.find(s => s === this.constants.PleaseSelect)) {
            this.hearingRoleList.unshift(this.constants.PleaseSelect);
        }
    }

    private setInterpretee(participant: VHParticipant): string {
        let interpreteeEmail = '';
        if (participant.interpreterFor) {
            interpreteeEmail = participant.interpreterFor;
        } else if (participant.linkedParticipants && participant.linkedParticipants.length > 0) {
            const interpretee = this.hearing.participants.find(p => p.id === participant.linkedParticipants[0].linkedParticipantId);
            interpreteeEmail = interpretee ? interpretee.email : '';
        }
        return interpreteeEmail;
    }
    private updateHearingRoleList(hearingRoleList: string[]) {
        if (this.interpreterEnhancementsFlag) {
            // interpreter enhances allow any number of interpreters to be added without being tied to a participant
            return;
        }

        // hide the interpreter value if participant list is empty or participant list has an interpreter.
        if (this.hearingHasAnInterpreter() || !this.hearingHasInterpretees()) {
            if (!this.interpreterSelected) {
                this.hearingRoleList = this.hearingRoleList.filter(item => item.toLowerCase() !== HearingRoles.INTERPRETER);
            }
        }
    }

    private hearingHasInterpretees(): boolean {
        return this.hearing.participants.some(
            p => p.userRoleName === 'Individual' && p.hearingRoleName !== Constants.HearingRoles.Interpreter && !this.isAnObserver(p)
        );
    }

    private hearingHasAnInterpreter(): boolean {
        const hearingHasInterpreter = this.hearing.participants.some(
            p => p.hearingRoleName?.toLowerCase() === HearingRoles.INTERPRETER.toLowerCase()
        );
        return hearingHasInterpreter;
    }

    isRoleRepresentative(hearingRole: string): boolean {
        const role = this.hearingRoles.find(x => x.name === hearingRole);

        if (!role) {
            return false;
        }

        return role && role.userRole === Constants.HearingRoles.Representative;
    }

    roleSelected() {
        this.isInterpreter = this.isRoleInterpreter(this.role.value);
        this.isRoleSelected = this.role.value !== this.constants.PleaseSelect;
        if (!this.isRoleRepresentative(this.role.value)) {
            this.companyName.clearValidators();
            this.representing.clearValidators();

            this.companyName.updateValueAndValidity();
            this.representing.updateValueAndValidity();

            this.companyName.setValue('');
            this.representing.setValue('');
        } else {
            this.companyName.setValidators([
                Validators.required,
                Validators.pattern(Constants.TextInputPattern),
                Validators.maxLength(255)
            ]);
            this.representing.setValidators([
                Validators.required,
                Validators.pattern(Constants.TextInputPattern),
                Validators.maxLength(255)
            ]);

            this.companyName.updateValueAndValidity();
            this.representing.updateValueAndValidity();

            this.companyNameIndividual.setValue('');
        }
        this.showDetails = true;
        this.isRepresentative = this.isRoleRepresentative(this.role.value);
        this.setInterpreterForValidation();
        this.setRepresenteeLabel();
    }

    private isRoleInterpreter(hearingRole: string): boolean {
        return hearingRole.toLowerCase() === HearingRoles.INTERPRETER.toLowerCase();
    }

    private setInterpreterForValidation() {
        const isInterpreter = this.isRoleInterpreter(this.role.value);
        if (isInterpreter && this.interpreterEnhancementsFlag) {
            this.interpreterFor.clearValidators();
            this.interpreterFor.reset();
            this.isInterpreter = true;
        } else if (isInterpreter && !this.interpreterEnhancementsFlag) {
            this.interpreterFor.setValidators([Validators.required, Validators.pattern(Constants.PleaseSelectPattern)]);
            this.interpreterFor.updateValueAndValidity();
            this.isInterpreter = true;
        } else {
            this.interpreterFor.clearValidators();
            this.interpreterFor.updateValueAndValidity();
            this.interpreterFor.setValue(Constants.PleaseSelect);
            this.isInterpreter = false;
        }
        this.interpreterForm?.forceValidation();
    }

    protected isAnObserver(participant: VHParticipant): boolean {
        return participant.hearingRoleName === Constants.HearingRoles.Observer;
    }

    private setRepresenteeLabel() {
        let labelText = 'Representing';
        let validationError = Constants.Error.RepresenteeErrorMsg;
        if (this.role.value === 'Intermediary') {
            labelText = 'Intermediary for';
            validationError = Constants.Error.IntermediaryForErrorMsg;
        }
        this.representeeLabelText = labelText;
        this.representeeErrorMessage = validationError;
    }
}
