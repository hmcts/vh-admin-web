import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, AfterContentInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Constants } from '../../common/constants';
import { IDropDownModel } from '../../common/model/drop-down.model';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ParticipantService } from '../services/participant.service';
import { CaseAndHearingRolesResponse } from '../../services/clients/api-client';
import { PartyModel } from '../../common/model/party.model';
import { Logger } from '../../services/logger';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-add-participant',
    templateUrl: './add-participant.component.html',
    styleUrls: ['./add-participant.component.css']
})
export class AddParticipantComponent extends BookingBaseComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
    canNavigate = true;
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

    @ViewChild(SearchEmailComponent) searchEmail: SearchEmailComponent;

    @ViewChild(ParticipantsListComponent, { static: true })
    participantsListComponent: ParticipantsListComponent;

    constructor(
        private searchService: SearchService,
        protected videoHearingService: VideoHearingsService,
        private participantService: ParticipantService,
        protected router: Router,
        protected bookingService: BookingService,
        private logger: Logger
    ) {
        super(bookingService, router, videoHearingService);
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
                })
                .catch(error => this.logger.error('Error to get participant case and hearing roles.', error));
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
            representing: this.representing
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
            this.getParticipant(selectedParticipant);
        }
    }

    private checkForExistingRequest() {
        this.hearing = this.videoHearingService.getCurrentRequest();
        if (this.hearing) {
            const anyParticipants = this.hearing.participants.find(x => !x.is_judge);
            if (this.editMode) {
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
        this.hearingRoleList = list ? list.hearingRoles : [];
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

        this.isRepresentative = this.isRoleRepresentative(this.participantDetails.hearing_role_name);

        this.form.setValue({
            party: this.participantDetails.case_role_name,
            role: this.participantDetails.hearing_role_name,
            title: this.participantDetails.title === undefined ? this.constants.PleaseSelect : this.participantDetails.title,
            firstName: this.participantDetails.first_name,
            lastName: this.participantDetails.last_name,
            phone: this.participantDetails.phone || '',
            displayName: this.participantDetails.display_name || '',
            companyName: this.participantDetails.company ? this.participantDetails.company : '',
            companyNameIndividual: this.participantDetails.company ? this.participantDetails.company : '',
            representing: this.participantDetails.representee ? this.participantDetails.representee : ''
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
        this.displayErrorNoParticipants = false;
        this.displayClear();
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
                this.hearing.participants.push(newParticipant);
                this.videoHearingService.updateHearingRequest(this.hearing);
                this.participantDetails = null;
                this.clearForm();
                this.displayNext();
                this.form.markAsPristine();
                this.showDetails = false;
            } else {
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
            this.saveParticipant();
            this.bookingHasParticipants = true;
        } else {
            this.actionsBeforeSave();
            if (this.form.valid && this.validEmail() && this.isRoleSelected && this.isTitleSelected) {
                this.isShowErrorSummary = false;
                this.hearing.participants.forEach(newParticipant => {
                    if (newParticipant.email === this.selectedParticipantEmail) {
                        this.mapParticipant(newParticipant);
                    }
                });
                this.clearForm();
                this.participantDetails = null;
                this.form.markAsPristine();
            } else {
                this.isShowErrorSummary = true;
            }
        }
    }

    actionsBeforeSave() {
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
            this.showConfirmationRemoveParticipant = true;
        }
    }

    removeParticipant() {
        // check if participant details were populated, if yes then clean form.
        if (this.searchEmail && this.searchEmail.email === this.selectedParticipantEmail) {
            this.clearForm();
        }
        this.participantService.removeParticipant(this.hearing, this.selectedParticipantEmail);
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
        if (this.isRoleRepresentative(this.role.value)) {
            newParticipant.company = this.companyName.value;
        } else {
            newParticipant.company = this.companyNameIndividual.value;
        }
        newParticipant.username = this.participantDetails ? this.participantDetails.username : '';
        newParticipant.representee = this.representing.value;
        newParticipant.is_exist_person = this.existingPersonEmails.findIndex(x => x === newParticipant.email) > -1;
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
        this.showCancelPopup = false;
        this.attemptingDiscardChanges = false;
    }

    handleCancelBooking() {
        this.showCancelPopup = false;
        this.form.reset();
        if (this.editMode) {
            this.navigateToSummary();
        } else {
            this.videoHearingService.cancelRequest();
            this.router.navigate([PageUrls.Dashboard]);
        }
    }

    cancelChanges() {
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
            representing: ''
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
                this.navigateToSummary();
            } else {
                this.router.navigate([PageUrls.Endpoints]);
            }
        } else {
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
    isRoleRepresentative(hearingRole: string): boolean {
        const representativeRoles = ['representative', 'prosecution', 'defence advocate', 'prosecution advocate'];
        return representativeRoles.includes(hearingRole.toLowerCase());
    }
}
