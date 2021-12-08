import { Directive, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { HearingRoles } from 'src/app/common/model/hearing-roles.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { PartyModel } from 'src/app/common/model/party.model';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { SearchEmailComponent } from '../search-email/search-email.component';

@Directive()
export abstract class AddParticipantBaseDirective extends BookingBaseComponent implements OnInit {
    isShowErrorSummary = false;
    caseAndHearingRoles: PartyModel[] = [];

    participantDetails: ParticipantModel;
    existingParticipant: boolean;
    existingPersonEmails: string[] = [];
    interpreterSelected = false;
    displayErrorNoParticipants = false;
    isRepresentative = false;
    hearingRoleList: string[];
    isRoleSelected = true;
    isPartySelected = true;
    isInterpreter = false;

    hearing: HearingModel;

    displayNextButton = true;
    displayAddButton = false;
    displayClearButton = false;
    displayUpdateButton = false;

    errorAlternativeEmail = false;
    errorJohAccountNotFound = false;
    errorJudiciaryAccount = false;
    errorNotFoundJohEmail = false;

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
    party: FormControl;
    phone: FormControl;
    representing: FormControl;
    title: FormControl;

    protected constants = Constants;

    @ViewChild(SearchEmailComponent) searchEmail: SearchEmailComponent;

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

    get partyInvalid() {
        return this.party.invalid && (this.party.dirty || this.party.touched || this.isShowErrorSummary);
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
        this.party = new FormControl(this.constants.PleaseSelect);
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
        this.phone = new FormControl('', [Validators.required, Validators.pattern(Constants.PhonePattern)]);
        this.displayName = new FormControl('', [
            Validators.required,
            Validators.pattern(Constants.TextInputPatternName),
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
            party: this.party,
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
            if (this.editMode) {
                this.displayNext();
            } else {
                this.displayAdd();
            }
        }
    }

    validEmail() {
        return this.showDetails && this.searchEmail ? this.searchEmail.validateEmail() : true;
    }
    validateJudgeAndJohMembers(): boolean {
        if (this.hearing?.participants.length) {
            const judge = this.hearing.participants.find(x => x.is_judge);
            return this.searchEmail?.email !== judge?.username;
        }
        return true;
    }

    public getParticipant(participantDetails: ParticipantModel) {
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
        this.participantDetails = Object.assign({}, participantDetails);

        if (participantDetails.is_exist_person) {
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
        this.isRepresentative = this.isRoleRepresentative(this.participantDetails.hearing_role_name, this.party.value);
        const formControlsObj = {
            party: this.participantDetails.case_role_name,
            role: this.participantDetails.hearing_role_name,
            title: this.participantDetails.title === undefined ? this.constants.PleaseSelect : this.participantDetails.title,
            firstName: this.participantDetails.first_name,
            lastName: this.participantDetails.last_name,
            email: this.participantDetails.email || '',
            phone: this.participantDetails.phone || '',
            displayName: this.participantDetails.display_name || '',
            companyName: this.participantDetails.company || '',
            companyNameIndividual: this.participantDetails.company || '',
            representing: this.participantDetails.representee || '',
            interpreterFor: this.setInterpretee(this.participantDetails) || this.constants.PleaseSelect
        };
        if (this.participantDetails.hearing_role_name === Constants.HearingRoles.StaffMember) {
            delete formControlsObj['interpreterFor'];
        }
        this.form.setValue(formControlsObj);

        setTimeout(() => {
            this.form.get('role').setValue(this.participantDetails.hearing_role_name);
            this.roleSelected();
        }, 500);
    }

    protected disableCaseAndHearingRoles() {
        this.form.get('party').disable();
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
        this.form.get('party').enable();
        this.form.get('role').enable();
    }

    resetPartyAndRole() {
        if (this.participantDetails.case_role_name) {
            this.setupHearingRoles(this.participantDetails.case_role_name);
        }
        if (
            this.isPartySelected &&
            !this.existingParticipant &&
            (!this.participantDetails.case_role_name || this.participantDetails.case_role_name.length === 0)
        ) {
            this.participantDetails.case_role_name = this.party.value;
        }
        if (
            this.isRoleSelected &&
            !this.existingParticipant &&
            (!this.participantDetails.hearing_role_name || this.participantDetails.hearing_role_name.length === 0)
        ) {
            this.participantDetails.hearing_role_name = this.role.value;
        }
    }

    setupHearingRoles(caseRoleName: string) {
        const list = this.caseAndHearingRoles.find(x => x.name === caseRoleName && x.name !== 'Judge' && x.name !== 'Staff Member');
        this.hearingRoleList = list ? list.hearingRoles.map(x => x.name) : [];
        this.updateHearingRoleList(this.hearingRoleList);
        if (!this.hearingRoleList.find(s => s === this.constants.PleaseSelect)) {
            this.hearingRoleList.unshift(this.constants.PleaseSelect);
        }
    }

    private setInterpretee(participant: ParticipantModel): string {
        let interpreteeEmail = '';
        if (participant.interpreterFor) {
            interpreteeEmail = participant.interpreterFor;
        } else if (participant.linked_participants && participant.linked_participants.length > 0) {
            const interpretee = this.hearing.participants.find(p => p.id === participant.linked_participants[0].linkedParticipantId);
            interpreteeEmail = interpretee ? interpretee.email : '';
        }
        return interpreteeEmail;
    }
    private updateHearingRoleList(hearingRoleList: string[]) {
        // hide the interpreter value if participant list is empty or participant list has an interpreter.
        if (this.hearingHasAnInterpreter() || !this.hearingHasInterpretees()) {
            if (!this.interpreterSelected) {
                this.hearingRoleList = this.hearingRoleList.filter(item => item.toLowerCase() !== HearingRoles.INTERPRETER);
            }
        }
    }

    private hearingHasInterpretees(): boolean {
        const notAllowedInterpreter = [HearingRoles.INTERPRETER.toLowerCase(), HearingRoles.OBSERVER.toLowerCase()];
        const hearingHasInterpretees = this.hearing.participants.some(
            p => p.user_role_name === 'Individual' && !notAllowedInterpreter.includes(p.hearing_role_name.toLowerCase())
        );
        return hearingHasInterpretees;
    }

    private hearingHasAnInterpreter(): boolean {
        const hearingHasInterpreter = this.hearing.participants.some(
            p => p.hearing_role_name?.toLowerCase() === HearingRoles.INTERPRETER.toLowerCase()
        );
        return hearingHasInterpreter;
    }

    isRoleRepresentative(hearingRole: string, party: string): boolean {
        const partyHearingRoles = this.caseAndHearingRoles.find(
            x => x.name === party && x.name !== 'Judge' && x.hearingRoles.find(y => y.name === hearingRole)
        );

        if (!partyHearingRoles) {
            return false;
        }

        const findHearingRole = partyHearingRoles.hearingRoles.find(x => x.name === hearingRole);
        return findHearingRole && findHearingRole.userRole === 'Representative';
    }

    roleSelected() {
        this.isRoleSelected = this.role.value !== this.constants.PleaseSelect;
        if (!this.isRoleRepresentative(this.role.value, this.party.value)) {
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
        this.isRepresentative = this.isRoleRepresentative(this.role.value, this.party.value);
        this.setInterpreterForValidation();
    }

    private isRoleInterpreter(hearingRole: string): boolean {
        return hearingRole.toLowerCase() === HearingRoles.INTERPRETER.toLowerCase();
    }
    private setInterpreterForValidation() {
        if (this.isRoleInterpreter(this.role.value)) {
            this.interpreterFor.setValidators([Validators.required, Validators.pattern(Constants.PleaseSelectPattern)]);
            this.interpreterFor.updateValueAndValidity();
            this.isInterpreter = true;
        } else {
            this.interpreterFor.clearValidators();
            this.interpreterFor.updateValueAndValidity();
            this.interpreterFor.setValue(Constants.PleaseSelect);
            this.isInterpreter = false;
        }
    }
}
