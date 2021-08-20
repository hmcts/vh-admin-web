import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from '../../common/constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { IDropDownModel } from '../../common/model/drop-down.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { BookingService } from '../../services/booking.service';
import { CaseAndHearingRolesResponse, LinkedParticipantRequest } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { AddParticipantBaseDirective } from 'src/app/booking/add-participant-base/add-participant-base.component';
import { ParticipantService } from '../services/participant.service';
import { ParticipantListComponent } from '../participant';
import { HearingRoles } from '../../common/model/hearing-roles.model';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { Validators } from '@angular/forms';

@Component({
    selector: 'app-add-participant',
    templateUrl: './add-participant.component.html',
    styleUrls: ['./add-participant.component.scss']
})
export class AddParticipantComponent extends AddParticipantBaseDirective implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
    constants = Constants;

    notFound: boolean;
    titleList: IDropDownModel[] = [];
    roleList: string[];
    selectedParticipantEmail: string = null;
    isTitleSelected = true;
    showCancelPopup = false;
    showConfirmationPopup = false;
    attemptingDiscardChanges = false;
    confirmationMessage: string;
    showConfirmationRemoveParticipant = false;
    removerFullName: string;
    localEditMode = false;
    isExistingHearing: boolean;
    isAnyParticipants: boolean;
    existingPerson: boolean;
    bookingHasParticipants: boolean;
    $subscriptions: Subscription[] = [];

    interpreteeList: ParticipantModel[] = [];
    showConfirmRemoveInterpretee = false;

    @ViewChild(ParticipantListComponent, { static: true })
    participantsListComponent: ParticipantListComponent;

    private judiciaryRoles = Constants.JudiciaryRoles;

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
        this.initialiseForm();
        super.ngOnInit();
    }

    onSelectedParticipantChangedWhenEditing(participantEmail: string) {
        if (this.editMode) {
            this.selectedParticipantEmail = participantEmail;
            this.showDetails = true;

            setTimeout(() => {
                if (this.searchEmail) {
                    this.repopulateParticipantToEdit();
                    this.displayUpdate();
                    this.localEditMode = true;
                    this.setParticipantEmail();
                }
            }, 500);
        }
    }

    ngAfterViewInit() {
        this.$subscriptions.push(
            this.participantsListComponent.selectedParticipant.subscribe(participantEmail => {
                const selectedParticipant = this.hearing.participants.find(s => s.email === participantEmail);
                if (selectedParticipant !== null && selectedParticipant !== undefined) {
                    this.editMode = this.participantsListComponent.canEditParticipant(selectedParticipant);
                    this.onSelectedParticipantChangedWhenEditing(participantEmail);
                }
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
                            self.onSelectedParticipantChangedWhenEditing(self.selectedParticipantEmail);
                            self.displayNext();
                        }
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
                this.subcribeForSeachEmailEvents();
            }
        }
    }

    subcribeForSeachEmailEvents() {
        this.searchEmail.notFoundEmailEvent$.subscribe(notFound => {
            if (notFound) {
                this.notFoundParticipant();
            } else {
                this.errorAlternativeEmail = false;
                this.errorJohAccountNotFound = false;
            }
        });
    }

    private setParticipantEmail() {
        this.searchEmail.email = this.participantDetails.email;
        this.searchEmail.participantDetails = this.participantDetails;
        this.searchEmail.isValidEmail = true;
        const participantHasId = this.participantDetails.id && this.participantDetails.id.length > 0;
        this.emailDisabled = participantHasId || this.participantDetails.is_exist_person;
    }

    initialiseForm() {
        this.initialiseForm();
        this.party.setValidators([Validators.required, Validators.pattern(this.constants.PleaseSelectPattern)]);

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
                    } else if (
                        self.showDetails &&
                        self.form.valid &&
                        self.searchEmail &&
                        self.searchEmail.validateEmail() &&
                        !self.searchEmail.errorNotFoundJohEmail
                    ) {
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
            this.interpreterSelected = selectedParticipant.hearing_role_name.toLowerCase() === HearingRoles.INTERPRETER;

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
        this.roleList = this.caseAndHearingRoles.filter(x => x.name !== 'Judge' && x.name !== 'Staff Member').map(x => x.name);
        this.roleList.unshift(this.constants.PleaseSelect);
        this.caseAndHearingRoles.forEach(x => {
            this.setupHearingRoles(x.name);
        });
    }

    notFoundParticipant() {
        this.logger.warn(`${this.loggerPrefix} Participant not found.`);
        if (this.judiciaryRoles.includes(this.role.value)) {
            this.errorJohAccountNotFound = true;
        }
        this.displayErrorNoParticipants = false;
        this.displayClear();
        if (this.participantDetails) {
            this.participantDetails.username = null;
        }
    }

    private displayUpdate() {
        this.displayNextButton = false;
        this.displayClearButton = true;
        this.displayUpdateButton = true;
        this.displayAddButton = false;
    }

    private displayClear() {
        this.displayNextButton = false;
        this.displayClearButton = true;
        this.displayAddButton = false;
        this.displayUpdateButton = false;
    }

    partySelected() {
        this.isPartySelected = this.party.value !== this.constants.PleaseSelect;
        this.setupHearingRoles(this.party.value);
    }

    onRoleSelected($event) {
        $event.stopImmediatePropagation();
        this.roleSelected();
        this.validateJudiciaryEmailAndRole();
    }

    titleSelected() {
        this.isTitleSelected = this.title.value !== this.constants.PleaseSelect;
    }

    validateJudiciaryEmailAndRole() {
        if (this.searchEmail && this.searchEmail.email.length) {
            this.searchService.searchJudiciaryEntries(this.searchEmail.email).subscribe(judiciaryEntries => {
                this.errorJudiciaryAccount = false;
                if (judiciaryEntries && judiciaryEntries.length) {
                    if (!this.judiciaryRoles.includes(this.role.value)) {
                        this.setErrorForJudiciaryAccount();
                    }
                } else {
                    if (this.judiciaryRoles.includes(this.role.value)) {
                        this.setErrorForJudiciaryAccount();
                    }
                }
            });
        }
    }

    private setErrorForJudiciaryAccount() {
        this.role.setErrors({ invalid: true });
        this.party.setErrors({ invalid: true });
        this.errorJudiciaryAccount = true;
    }

    saveParticipant() {
        this.actionsBeforeSave();

        if (
            this.form.valid &&
            this.validEmail() &&
            this.isRoleSelected &&
            this.isPartySelected &&
            this.isTitleSelected &&
            !this.errorAlternativeEmail &&
            !this.errorJohAccountNotFound &&
            !this.errorJudiciaryAccount
        ) {
            this.isShowErrorSummary = false;
            this.form.markAsUntouched();
            this.form.markAsPristine();
            this.form.updateValueAndValidity();
            const newParticipant = new ParticipantModel();

            if (this.participantDetails) {
                this.participantDetails.addedDuringHearing =
                    !this.videoHearingService.isConferenceClosed() && this.videoHearingService.isHearingAboutToStart();
            }

            this.mapParticipant(newParticipant);

            if (!this.participantService.checkDuplication(newParticipant.email, this.hearing.participants)) {
                this.addLinkedParticipant(newParticipant);

                this.hearing.participants.push(newParticipant);
                this.hearing.participants = [...this.hearing.participants];
                this.hearing = Object.assign({}, this.hearing);

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
        this.interpreterSelected = false;
    }

    updateParticipantAction() {
        this.updateParticipant();
        this.videoHearingService.updateHearingRequest(this.hearing);
        this.displayNext();
        this.localEditMode = false;
        this.interpreterSelected = false;
    }

    updateParticipant() {
        if (!this.existingParticipant && !this.participantDetails) {
            this.logger.debug(`${this.loggerPrefix} Attempting to add participant to booking.`);
            this.saveParticipant();
            this.bookingHasParticipants = true;
        } else {
            this.actionsBeforeSave();
            if (this.form.valid && this.validEmail() && this.isRoleSelected && this.isTitleSelected && !this.errorAlternativeEmail) {
                this.isShowErrorSummary = false;
                this.hearing.participants.forEach(newParticipant => {
                    if (newParticipant.email === this.selectedParticipantEmail) {
                        this.mapParticipant(newParticipant);
                        this.updateLinkedParticipant(newParticipant);
                    }
                });
                this.hearing.participants = [...this.hearing.participants];
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
        this.hearing = Object.assign({}, this.hearing);
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
        newParticipant.user_role_name = this.getUserRoleName(newParticipant);
        newParticipant.addedDuringHearing = this.participantDetails?.addedDuringHearing;
    }

    private getUserRoleName(newParticipant: ParticipantModel): string {
        const userRole = this.caseAndHearingRoles
            .find(c => c.name === newParticipant.case_role_name)
            ?.hearingRoles.find(h => h.name === newParticipant.hearing_role_name)?.userRole;
        return userRole;
    }

    private addUpdateLinkedParticipant(newParticipant: ParticipantModel): LinkedParticipantModel[] {
        return newParticipant.hearing_role_name.toLowerCase() === HearingRoles.INTERPRETER
            ? this.updateLinkedParticipantList(newParticipant)
            : [];
    }

    private updateLinkedParticipantList(newParticipant: ParticipantModel): LinkedParticipantModel[] {
        if (this.editMode) {
            return this.updateNewParticipantToLinkedParticipant(newParticipant);
        } else {
            return this.addNewParticipantToLinkedParticipant(newParticipant);
        }
    }

    private updateNewParticipantToLinkedParticipant(newParticipant: ParticipantModel): LinkedParticipantModel[] {
        if (this.localEditMode) {
            const linkedParticipant = newParticipant.linked_participants[0];
            const interpretee = this.hearing.participants.find(p => p.id === linkedParticipant.linkedParticipantId);
            interpretee.linked_participants = [];
            linkedParticipant.linkedParticipantId = this.getInterpreteeId(newParticipant.interpreterFor);
            linkedParticipant.linkedParticipantEmail = newParticipant.interpreterFor;
            linkedParticipant.participantEmail = newParticipant.email;
            linkedParticipant.participantId = newParticipant.id;
            return [linkedParticipant];
        } else {
            return this.addNewParticipantToLinkedParticipant(newParticipant);
        }
    }

    private addNewParticipantToLinkedParticipant(newParticipant: ParticipantModel): LinkedParticipantModel[] {
        const linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.participantEmail = newParticipant.email;
        linkedParticipant.linkedParticipantEmail = newParticipant.interpreterFor;
        return [linkedParticipant];
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
            email: '',
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
        this.errorJudiciaryAccount = false;
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
        const NotAllowedInterpreter: string[] = [HearingRoles.INTERPRETER.toLowerCase(), HearingRoles.OBSERVER.toLowerCase()];

        this.interpreteeList = this.hearing.participants.filter(
            p => p.user_role_name === 'Individual' && !NotAllowedInterpreter.includes(p.hearing_role_name.toLowerCase())
        );

        const interpreteeModel: ParticipantModel = {
            id: this.constants.PleaseSelect,
            first_name: this.constants.PleaseSelect,
            last_name: '',
            email: this.constants.PleaseSelect,
            is_exist_person: false,
            is_judge: false,
            is_courtroom_account: false
        };

        this.interpreteeList.unshift(interpreteeModel);
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
        if (interpreter) {
            this.participantService.removeParticipant(this.hearing, interpreter.email);
        }
        this.participantService.removeParticipant(this.hearing, this.selectedParticipantEmail);
        this.removeLinkedParticipant(this.selectedParticipantEmail);
        this.hearing = Object.assign({}, this.hearing);
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
}
