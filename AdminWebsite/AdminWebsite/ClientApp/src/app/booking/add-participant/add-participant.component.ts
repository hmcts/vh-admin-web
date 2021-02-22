import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from '../../common/constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { IDropDownModel } from '../../common/model/drop-down.model';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { PartyModel } from '../../common/model/party.model';
import { BookingService } from '../../services/booking.service';
import { CaseAndHearingRolesResponse, LinkedParticipantRequest } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { ParticipantService } from '../services/participant.service';
import { HearingRoles } from '../../common/model/hearing-roles.model';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';

@Component({
    selector: 'app-add-participant',
    templateUrl: './add-participant.component.html',
    styleUrls: ['./add-participant.component.scss']
})
export class AddParticipantComponent extends BookingBaseComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
    constants = Constants;

    emailDisabled = false;
    participantDetails: ParticipantModel;
    notFound: boolean;
    hearing: HearingModel;
    titleList: IDropDownModel[] = [];
    roleList: string[];
    hearingRoleList: string[];
    caseAndHearingRoles: PartyModel[] = [];
    selectedParticipantEmail: string = null;
    private role: FormControl;
    private party: FormControl;
    private title: FormControl;
    private firstName: FormControl;
    private lastName: FormControl;
    private phone: FormControl;
    private displayName: FormControl;
    private companyName: FormControl;
    private companyNameIndividual: FormControl;
    private representing: FormControl;
    isRoleSelected = true;
    isPartySelected = true;
    isTitleSelected = true;
    isShowErrorSummary = false;
    showDetails = false;
    showCancelPopup = false;
    showConfirmationPopup = false;
    attemptingDiscardChanges = false;
    confirmationMessage: string;
    showConfirmationRemoveParticipant = false;
    removerFullName: string;
    displayNextButton = true;
    displayAddButton = false;
    displayClearButton = false;
    displayUpdateButton = false;
    displayErrorNoParticipants = false;
    localEditMode = false;
    isExistingHearing: boolean;
    isAnyParticipants: boolean;
    existingPerson: boolean;
    existingParticipant: boolean;
    isRepresentative = false;
    bookingHasParticipants: boolean;
    existingPersonEmails: string[] = [];
    $subscriptions: Subscription[] = [];

    private interpreterFor: FormControl;
    interpreteeList: ParticipantModel[] = [];
    isInterpreter = false;
    showConfirmRemoveInterpretee = false;
    interpreterSelected = false;

    @ViewChild(SearchEmailComponent) searchEmail: SearchEmailComponent;

    @ViewChild(ParticipantsListComponent, { static: true })
    participantsListComponent: ParticipantsListComponent;

    constructor(
        private searchService: SearchService,
        protected videoHearingService: VideoHearingsService,
        private participantService: ParticipantService,
        protected router: Router,
        protected bookingService: BookingService,
        protected logger: Logger
    ) {
        super(bookingService, router, videoHearingService, logger);
        this.titleList = searchService.TitleList;
    }

    ngOnInit() {
        this.checkForExistingRequest();
        this.initializeForm();
        super.ngOnInit();
    }

    ngAfterViewInit() {
        this.$subscriptions.push(
            this.participantsListComponent.selectedParticipant.subscribe(participantEmail => {
                this.selectedParticipantEmail = participantEmail;
                this.interpreterSelected = this.hearing.participants.some(
                    p => p.email === this.selectedParticipantEmail && p.hearing_role_name.toLowerCase() === HearingRoles.INTERPRETER
                );
                this.showDetails = true;
                setTimeout(() => {
                    this.repopulateParticipantToEdit();
                    this.displayUpdate();
                    this.localEditMode = true;
                    if (this.searchEmail) {
                        this.setParticipantEmail();
                    }
                }, 500);
            })
        );

        this.$subscriptions.push(
            this.participantsListComponent.selectedParticipantToRemove.subscribe(participantEmail => {
                this.selectedParticipantEmail = participantEmail;
                this.confirmRemoveParticipant();
            })
        );

        setTimeout(() => {
            const self = this;
            this.logger.debug(`${this.loggerPrefix} Getting participant roles.`);
            this.videoHearingService
                .getParticipantRoles(this.hearing.case_type)
                .then((data: CaseAndHearingRolesResponse[]) => {
                    self.setupRoles(data);
                    if (self.editMode) {
                        self.selectedParticipantEmail = self.bookingService.getParticipantEmail();
                        if (!self.selectedParticipantEmail || self.selectedParticipantEmail.length === 0) {
                            // no participants, we need to add one
                            self.showDetails = false;
                            self.displayAdd();
                        } else {
                            self.showDetails = true;
                            setTimeout(() => {
                                if (this.searchEmail && this.participantDetails) {
                                    this.setParticipantEmail();
                                }
                            }, 500);

                            self.displayNext();
                        }
                        self.repopulateParticipantToEdit();
                    }
                    self.populateInterpretedForList();
                })
                .catch(error => this.logger.error(`${this.loggerPrefix} Error to get participant case and hearing roles.`, error));
        }, 500);
    }

    ngAfterContentInit() {
        if (this.editMode) {
            if (this.searchEmail && this.participantDetails) {
                this.setParticipantEmail();
            }
        }
    }

    private setParticipantEmail() {
        this.searchEmail.email = this.participantDetails.email;
        this.searchEmail.searchTerm.next(this.searchEmail.email);
        this.searchEmail.isValidEmail = true;
        const participantHasId = this.participantDetails.id && this.participantDetails.id.length > 0;
        this.emailDisabled = participantHasId || this.participantDetails.is_exist_person;
    }

    initializeForm() {
        this.role = new FormControl(this.constants.PleaseSelect, [
            Validators.required,
            Validators.pattern(this.constants.PleaseSelectPattern)
        ]);
        this.party = new FormControl(this.constants.PleaseSelect, [
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
            phone: this.phone,
            displayName: this.displayName,
            companyName: this.companyName,
            companyNameIndividual: this.companyNameIndividual,
            representing: this.representing,
            interpreterFor: this.interpreterFor
        });

        const self = this;
        this.$subscriptions.push(
            this.form.valueChanges.subscribe(result => {
                setTimeout(() => {
                    if (
                        (self.showDetails &&
                            self.role.value === self.constants.PleaseSelect &&
                            self.party.value === self.constants.PleaseSelect &&
                            self.title.value === self.constants.PleaseSelect &&
                            self.firstName.value === '' &&
                            self.lastName.value === '' &&
                            self.phone.value === '' &&
                            self.displayName.value === '') ||
                        self.editMode
                    ) {
                        self.displayNext();
                    } else if (
                        !self.showDetails &&
                        self.role.value === self.constants.PleaseSelect &&
                        self.party.value === self.constants.PleaseSelect
                    ) {
                        self.displayNext();
                    } else if (self.showDetails && self.form.valid && self.searchEmail && self.searchEmail.validateEmail()) {
                        if (self.localEditMode) {
                            self.displayUpdate();
                        } else {
                            self.displayAdd();
                        }
                    } else {
                        self.displayClear();
                    }
                }, 500);
            })
        );
    }

    private repopulateParticipantToEdit() {
        const selectedParticipant = this.hearing.participants.find(s => s.email === this.selectedParticipantEmail);
        if (selectedParticipant) {
            this.logger.debug(`${this.loggerPrefix} Repopulating participant to edit.`, {
                hearing: this.hearing.hearing_id,
                participant: selectedParticipant.id
            });
            this.getParticipant(selectedParticipant);
        }
    }

    private checkForExistingRequest() {
        this.hearing = this.videoHearingService.getCurrentRequest();
        if (this.hearing) {
            this.logger.debug(`${this.loggerPrefix} Found existing hearing.`, { hearing: this.hearing.hearing_id });
            const anyParticipants = this.hearing.participants.find(x => !x.is_judge);
            if (this.editMode) {
                this.logger.debug(`${this.loggerPrefix} Mapping existing participants.`, { hearing: this.hearing.hearing_id });
                this.bookingHasParticipants = anyParticipants && !anyParticipants.is_judge;
            }
        }
    }

    setupRoles(data: CaseAndHearingRolesResponse[]) {
        this.caseAndHearingRoles = this.participantService.mapParticipantsRoles(data);
        this.roleList = this.caseAndHearingRoles.filter(x => x.name !== 'Judge').map(x => x.name);
        this.roleList.unshift(this.constants.PleaseSelect);
        this.caseAndHearingRoles.forEach(x => {
            this.setupHearingRoles(x.name);
        });
    }

    setupHearingRoles(caseRoleName: string) {
        const list = this.caseAndHearingRoles.find(x => x.name === caseRoleName && x.name !== 'Judge');
        this.hearingRoleList = list ? list.hearingRoles.map(x => x.name) : [];
        this.updateHearingRoleList(this.hearingRoleList);
        if (!this.hearingRoleList.find(s => s === this.constants.PleaseSelect)) {
            this.hearingRoleList.unshift(this.constants.PleaseSelect);
        }
    }

    public getParticipant(participantDetails: ParticipantModel) {
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

        this.form.setValue({
            party: this.participantDetails.case_role_name,
            role: this.participantDetails.hearing_role_name,
            title: this.participantDetails.title === undefined ? this.constants.PleaseSelect : this.participantDetails.title,
            firstName: this.participantDetails.first_name,
            lastName: this.participantDetails.last_name,
            phone: this.participantDetails.phone || '',
            displayName: this.participantDetails.display_name || '',
            companyName: this.participantDetails.company || '',
            companyNameIndividual: this.participantDetails.company || '',
            representing: this.participantDetails.representee || '',
            interpreterFor: this.setInterpretee(this.participantDetails) || this.constants.PleaseSelect
        });

        setTimeout(() => {
            this.form.get('role').setValue(this.participantDetails.hearing_role_name);
            this.roleSelected();
        }, 500);
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

    notFoundParticipant() {
        this.logger.warn(`${this.loggerPrefix} Participant not found.`);
        this.displayErrorNoParticipants = false;
        this.displayClear();
        if (this.participantDetails) {
            this.participantDetails.username = null;
        }
    }

    emailChanged() {
        if (this.form.valid && this.validEmail()) {
            if (this.editMode) {
                this.displayNext();
            } else {
                this.displayAdd();
            }
        }
    }

    private displayAdd() {
        this.displayNextButton = false;
        this.displayClearButton = true;
        this.displayAddButton = true;
        this.displayUpdateButton = false;
    }

    private displayUpdate() {
        this.displayNextButton = false;
        this.displayClearButton = true;
        this.displayUpdateButton = true;
        this.displayAddButton = false;
    }

    private displayNext() {
        this.displayNextButton = true;
        this.displayClearButton = false;
        this.displayAddButton = false;
        this.displayUpdateButton = false;
    }

    private displayClear() {
        this.displayNextButton = false;
        this.displayClearButton = true;
        this.displayAddButton = false;
        this.displayUpdateButton = false;
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
    partySelected() {
        this.isPartySelected = this.party.value !== this.constants.PleaseSelect;
        this.setupHearingRoles(this.party.value);
    }

    onRoleSelected($event) {
        $event.stopImmediatePropagation();
        this.roleSelected();
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

    titleSelected() {
        this.isTitleSelected = this.title.value !== this.constants.PleaseSelect;
    }

    validEmail() {
        return this.showDetails && this.searchEmail ? this.searchEmail.validateEmail() : true;
    }

    saveParticipant() {
        this.actionsBeforeSave();
        if (this.form.valid && this.validEmail() && this.isRoleSelected && this.isPartySelected && this.isTitleSelected) {
            this.isShowErrorSummary = false;
            this.form.markAsUntouched();
            this.form.markAsPristine();
            this.form.updateValueAndValidity();
            const newParticipant = new ParticipantModel();
            this.mapParticipant(newParticipant);
            if (!this.participantService.checkDuplication(newParticipant.email, this.hearing.participants)) {
                (newParticipant as ParticipantModel & { isRepresentative: boolean }).isRepresentative = !!newParticipant.representee;
                this.addLinkedParticipant(newParticipant);
                this.hearing.participants.push(newParticipant);
                this.populateInterpretedForList();
                this.videoHearingService.updateHearingRequest(this.hearing);
                this.logger.debug(`${this.loggerPrefix} Saved participant to booking. Clearing form.`, {
                    hearing: this.hearing?.hearing_id,
                    participant: newParticipant.id,
                    existingPerson: newParticipant.is_exist_person,
                    email: newParticipant.email,
                    username: newParticipant.username
                });
                this.participantDetails = null;
                this.clearForm();
                this.displayNext();
                this.form.markAsPristine();
                this.showDetails = false;
            } else {
                this.logger.warn(`${this.loggerPrefix} Cannot save existing participant to booking`, {
                    hearing: this.hearing?.hearing_id,
                    participant: newParticipant.id,
                    existingPerson: newParticipant.is_exist_person,
                    email: newParticipant.email,
                    username: newParticipant.username
                });
                this.showConfirmationPopup = true;
                const message = `You have already added ${newParticipant.first_name} ${newParticipant.last_name} to this hearing`;
                this.confirmationMessage = message;
            }
        } else {
            this.isShowErrorSummary = true;
        }
    }

    updateParticipantAction() {
        this.updateParticipant();
        this.videoHearingService.updateHearingRequest(this.hearing);
        this.displayNext();
        this.localEditMode = false;
    }

    updateParticipant() {
        if (!this.existingParticipant && !this.participantDetails) {
            this.logger.debug(`${this.loggerPrefix} Attempting to add participant to booking.`);
            this.saveParticipant();
            this.bookingHasParticipants = true;
        } else {
            this.actionsBeforeSave();
            if (this.form.valid && this.validEmail() && this.isRoleSelected && this.isTitleSelected) {
                this.isShowErrorSummary = false;
                this.hearing.participants.forEach(newParticipant => {
                    if (newParticipant.email === this.selectedParticipantEmail) {
                        this.mapParticipant(newParticipant);
                        this.updateLinkedParticipant(newParticipant);
                    }
                });
                this.clearForm();
                this.participantDetails = null;
                this.form.markAsPristine();
            } else {
                this.logger.warn(`${this.loggerPrefix} Form is not valid. Unable to add participant to booking.`);
                this.isShowErrorSummary = true;
            }
        }
    }

    actionsBeforeSave() {
        this.logger.debug(`${this.loggerPrefix} Marking all pre-populated fields as touched.`);
        this.roleSelected();
        this.role.markAsTouched();
        this.firstName.markAsTouched();
        this.lastName.markAsTouched();
        this.phone.markAsTouched();
        this.displayName.markAsTouched();
    }

    confirmRemoveParticipant() {
        if (this.selectedParticipantEmail) {
            const participant = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
            const title = participant && participant.title ? `${participant.title}` : '';
            this.removerFullName = participant ? `${title} ${participant.first_name} ${participant.last_name}` : '';
            const anyParticipants = this.hearing.participants.filter(x => !x.is_judge);
            this.bookingHasParticipants = anyParticipants && anyParticipants.length > 1;

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
        }
    }

    removeParticipant() {
        // check if participant details were populated, if yes then clean form.
        if (this.searchEmail && this.searchEmail.email === this.selectedParticipantEmail) {
            this.clearForm();
        }
        this.participantService.removeParticipant(this.hearing, this.selectedParticipantEmail);
        this.removeLinkedParticipant(this.selectedParticipantEmail);
        this.videoHearingService.updateHearingRequest(this.hearing);
        this.videoHearingService.setBookingHasChanged(true);
    }

    mapParticipant(newParticipant: ParticipantModel) {
        newParticipant.first_name = this.firstName.value;
        newParticipant.last_name = this.lastName.value;
        newParticipant.phone = this.phone.value;
        newParticipant.title = this.title.value === this.constants.PleaseSelect ? null : this.title.value;
        newParticipant.case_role_name = this.party.value;
        newParticipant.hearing_role_name = this.role.value;
        newParticipant.email = this.searchEmail ? this.searchEmail.email : '';
        newParticipant.display_name = this.displayName.value;
        if (this.isRoleRepresentative(this.role.value, this.party.value)) {
            newParticipant.company = this.companyName.value;
        } else {
            newParticipant.company = this.companyNameIndividual.value;
        }
        newParticipant.username = this.participantDetails ? this.participantDetails.username : '';
        newParticipant.representee = this.representing.value;
        newParticipant.is_exist_person = this.existingPersonEmails.findIndex(x => x === newParticipant.email) > -1;
        newParticipant.interpreterFor = this.interpreterFor.value === this.constants.PleaseSelect ? null : this.interpreterFor.value;
        newParticipant.linked_participants = this.addUpdateLinkedParticipant(newParticipant);
    }

    private addUpdateLinkedParticipant(newParticipant: ParticipantModel): LinkedParticipantModel[] {
        const _linkedParticipants: LinkedParticipantModel[] = [];
        if (newParticipant.hearing_role_name.toLowerCase() === HearingRoles.INTERPRETER) {
            if (this.editMode) {
                const linkedParticipant = newParticipant.linked_participants[0];
                const interpretee = this.hearing.participants.find(p => p.id === linkedParticipant.linkedParticipantId);
                interpretee.linked_participants = [];
                linkedParticipant.linkedParticipantId = this.getInterpreteeId(newParticipant.interpreterFor);
                linkedParticipant.participantId = newParticipant.id;
                _linkedParticipants.push(linkedParticipant);
            } else {
                const linkedParticipant = new LinkedParticipantModel();
                linkedParticipant.linkType = LinkedParticipantType.Interpreter;
                linkedParticipant.participantEmail = newParticipant.email;
                linkedParticipant.linkedParticipantEmail = newParticipant.interpreterFor;
                _linkedParticipants.push(linkedParticipant);
            }
        }
        return _linkedParticipants;
    }
    private getInterpreteeId(email: string): string {
        const participantList = this.hearing.participants;
        const interpretee = participantList.find(p => p.email === email);
        return interpretee?.id;
    }

    addParticipantCancel() {
        if (this.editMode) {
            if (this.form.dirty || this.form.touched) {
                this.attemptingDiscardChanges = true;
            } else {
                this.navigateToSummary();
            }
        } else {
            this.showCancelPopup = true;
        }
    }

    handleContinueBooking() {
        this.logger.debug(`${this.loggerPrefix} Rejected cancellation. Continuing with booking.`);
        this.showCancelPopup = false;
        this.attemptingDiscardChanges = false;
    }

    handleCancelBooking() {
        this.showCancelPopup = false;
        this.form.reset();
        if (this.editMode) {
            this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary.`);
            this.navigateToSummary();
        } else {
            this.logger.debug(`${this.loggerPrefix} Cancelling booking and returning to dashboard.`);
            this.videoHearingService.cancelRequest();
            this.router.navigate([PageUrls.Dashboard]);
        }
    }

    cancelChanges() {
        this.logger.debug(`${this.loggerPrefix} Resetting changes. Returning to summary.`);
        this.attemptingDiscardChanges = false;
        this.form.reset();
        this.navigateToSummary();
    }

    handleConfirmation() {
        this.showConfirmationPopup = false;
    }

    handleContinueRemove() {
        this.showConfirmationRemoveParticipant = false;
        this.removeParticipant();
        this.populateInterpretedForList();
    }

    handleCancelRemove() {
        this.showConfirmationRemoveParticipant = false;
    }

    clearForm() {
        this.enableFields();
        this.form.setValue({
            role: this.constants.PleaseSelect,
            party: this.constants.PleaseSelect,
            title: this.constants.PleaseSelect,
            firstName: '',
            lastName: '',
            phone: '',
            displayName: '',
            companyName: '',
            companyNameIndividual: '',
            representing: '',
            interpreterFor: this.constants.PleaseSelect
        });
        this.form.markAsUntouched();
        this.form.markAsPristine();
        this.form.updateValueAndValidity();
        if (this.showDetails && this.searchEmail) {
            this.searchEmail.clearEmail();
        }
        this.showDetails = false;
        this.resetEditMode();
        this.localEditMode = false;
        this.isShowErrorSummary = false;
        this.isRoleSelected = true;
        this.isPartySelected = true;

        if (this.hearing.participants.length > 1) {
            this.displayNext();
        }
    }

    /**
     * Show validation error if not valid participant is added,
     * if we are editing a participant, update it and go to summary
     * otherwise proceed to next edit screen
     */
    next() {
        if (this.checkParticipants()) {
            if (this.editMode) {
                this.updateParticipant();
                this.videoHearingService.updateHearingRequest(this.hearing);
                if (this.isShowErrorSummary) {
                    return;
                }
                this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary.`);
                this.navigateToSummary();
            } else {
                this.logger.debug(`${this.loggerPrefix} Proceeding to endpoints`);
                this.router.navigate([PageUrls.Endpoints]);
            }
        } else {
            this.logger.warn(`${this.loggerPrefix} Unable to proceed. No participants added to booking`);
            this.displayErrorNoParticipants = true;
        }
    }

    private checkParticipants(): boolean {
        let participantsValid = false;
        if (this.hearing.participants && this.hearing.participants.length > 0) {
            const anyParticipants = this.hearing.participants.filter(x => !x.is_judge);
            participantsValid = anyParticipants && anyParticipants.length > 0;
        }
        return participantsValid;
    }

    get canNavigate() {
        return this.checkParticipants();
    }

    hasChanges(): Observable<boolean> | boolean {
        if (this.form.dirty) {
            this.showCancelPopup = true;
        }
        return this.form.dirty;
    }

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
    }

    disableLastFirstNames() {
        this.form.get('lastName').disable();
        this.form.get('firstName').disable();
    }
    disableCaseAndHearingRoles() {
        this.form.get('party').disable();
        this.form.get('role').disable();
    }
    enableFields() {
        this.emailDisabled = false;
        this.form.get('lastName').enable();
        this.form.get('firstName').enable();
        this.form.get('party').enable();
        this.form.get('role').enable();
    }

    firstNameOnBlur() {
        const text = SanitizeInputText(this.firstName.value);
        this.firstName.setValue(text);
    }

    lastNameOnBlur() {
        const text = SanitizeInputText(this.lastName.value);
        this.lastName.setValue(text);
    }

    companyNameIndividualOnBlur() {
        const text = SanitizeInputText(this.companyNameIndividual.value);
        this.companyNameIndividual.setValue(text);
    }

    displayNameOnBlur() {
        const text = SanitizeInputText(this.displayName.value);
        this.displayName.setValue(text);
    }

    companyNameOnBlur() {
        const text = SanitizeInputText(this.companyName.value);
        this.companyName.setValue(text);
    }

    representingOnBlur() {
        const text = SanitizeInputText(this.representing.value);
        this.representing.setValue(text);
    }

    ngOnDestroy() {
        this.clearForm();
        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }
    isRoleRepresentative(hearingRole: string, party: string): boolean {
        console.log('*** ' + party + ' : ' + hearingRole);
        console.log(JSON.stringify(this.caseAndHearingRoles));

        const partyHearingRoles = this.caseAndHearingRoles.find(
            x => x.name === party && x.name !== 'Judge' && x.hearingRoles.find(y => y.name === hearingRole)
        );

        if (!partyHearingRoles) {
            return false;
        }

        const findHearingRole = partyHearingRoles.hearingRoles.find(x => x.name === hearingRole);
        return findHearingRole && findHearingRole.userRole === 'Representative';
    }

    handleContinueRemoveInterpreter() {
        this.showConfirmRemoveInterpretee = false;
        this.removeInterpreteeAndInterpreter();
        this.populateInterpretedForList();
    }
    handleCancelRemoveInterpreter() {
        this.showConfirmRemoveInterpretee = false;
    }
    get interpreterForInvalid() {
        return this.interpreterFor.invalid && (this.interpreterFor.dirty || this.interpreterFor.touched || this.isShowErrorSummary);
    }
    private populateInterpretedForList() {
        const interpreteeHearingRolesList: Array<string> = [
            HearingRoles.LITIGANT_IN_PERSON,
            HearingRoles.WITNESS,
            HearingRoles.APP,
            HearingRoles.MACKENZIE_FRIEND
        ];
        this.interpreteeList = this.hearing.participants.filter(item =>
            interpreteeHearingRolesList.includes(item.hearing_role_name.toLowerCase())
        );
        const interpreteeModel: ParticipantModel = {
            id: this.constants.PleaseSelect,
            first_name: this.constants.PleaseSelect,
            last_name: '',
            email: this.constants.PleaseSelect,
            is_exist_person: false,
            is_judge: false
        };
        this.interpreteeList.unshift(interpreteeModel);
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
    private isRoleInterpreter(hearingRole: string): boolean {
        return hearingRole.toLowerCase() === HearingRoles.INTERPRETER.toLowerCase();
    }
    private hearingHasAnInterpreter(): boolean {
        const hearingHasInterpreter = this.hearing.participants.some(
            p => p.hearing_role_name.toLowerCase() === HearingRoles.INTERPRETER.toLowerCase()
        );
        return hearingHasInterpreter;
    }
    private hearingHasInterpretees(): boolean {
        const interpreteeHearingRolesList: Array<string> = [
            HearingRoles.LITIGANT_IN_PERSON,
            HearingRoles.WITNESS,
            HearingRoles.APP,
            HearingRoles.MACKENZIE_FRIEND
        ];
        const hearingHasInterpretees = this.hearing.participants.some(item =>
            interpreteeHearingRolesList.includes(item.hearing_role_name.toLowerCase())
        );
        return hearingHasInterpretees;
    }
    private updateHearingRoleList(hearingRoleList: string[]) {
        // hide the interpreter value if participant list is empty or participant list has an interpreter.
        if (this.hearingHasAnInterpreter() || !this.hearingHasInterpretees()) {
            // if (!this.interpreterSelected) {
            this.hearingRoleList = this.hearingRoleList.filter(item => item.toLowerCase() !== HearingRoles.INTERPRETER);
            // }
        }
    }
    private removeInterpreteeAndInterpreter() {
        // check if participant details were populated, if yes then clean form.
        if (this.searchEmail && this.searchEmail.email === this.selectedParticipantEmail) {
            this.clearForm();
        }
        const interpretee = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
        let interpreter: ParticipantModel;
        if (interpretee.linked_participants && interpretee.linked_participants.length > 0) {
            interpreter = this.hearing.participants.find(i => i.id === interpretee.linked_participants[0].linkedParticipantId);
        } else {
            interpreter = this.hearing.participants.find(i => i.interpreterFor === this.selectedParticipantEmail);
        }
        // const interpreter = this.hearing.participants.find(i => i.interpreterFor === this.selectedParticipantEmail);
        if (interpreter) {
            this.participantService.removeParticipant(this.hearing, interpreter.email);
        }
        this.participantService.removeParticipant(this.hearing, this.selectedParticipantEmail);
        this.removeLinkedParticipant(this.selectedParticipantEmail);
        this.videoHearingService.updateHearingRequest(this.hearing);
        this.videoHearingService.setBookingHasChanged(true);
    }
    private addLinkedParticipant(newParticipant: ParticipantModel): void {
        if (newParticipant.interpreterFor) {
            const interpretee = this.getInterpretee(newParticipant.interpreterFor);
            const linkedParticipant: LinkedParticipantModel = {
                participantEmail: newParticipant.email,
                linkedParticipantEmail: interpretee,
                linkType: LinkedParticipantType.Interpreter
            };
            this.hearing.linked_participants.push(linkedParticipant);
        }
    }
    private updateLinkedParticipant(newParticipant: ParticipantModel): void {
        this.hearing.linked_participants = [];
        this.addLinkedParticipant(newParticipant);
    }
    private removeLinkedParticipant(email: string): void {
        // removes both the linked participants.
        const interpreterExists = this.hearing.linked_participants.some(p => p.participantEmail === email);
        const interpreteeExists = this.hearing.linked_participants.some(p => p.linkedParticipantEmail === email);
        if (interpreterExists || interpreteeExists) {
            this.hearing.linked_participants = [];
        }
    }
    private getInterpretee(email: string): string {
        const interpretee = this.hearing.participants.find(p => p.email === email);
        return interpretee ? interpretee.email : '';
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
}
