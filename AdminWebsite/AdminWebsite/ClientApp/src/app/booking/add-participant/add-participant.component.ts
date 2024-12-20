import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Constants } from '../../common/constants';
import { SanitizeInputText } from '../../common/formatters/sanitize-input-text';
import { IDropDownModel } from '../../common/model/drop-down.model';
import { BookingService } from '../../services/booking.service';
import { HearingRoleResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { AddParticipantBaseDirective } from 'src/app/booking/add-participant-base/add-participant-base.component';
import { ParticipantService } from '../services/participant.service';
import { ParticipantListComponent } from '../participant';
import { HearingRoles } from '../../common/model/hearing-roles.model';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { takeUntil } from 'rxjs/operators';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { InterpreterSelectedDto } from '../interpreter-form/interpreter-selected.model';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({
    selector: 'app-add-participant',
    templateUrl: './add-participant.component.html',
    styleUrls: ['./add-participant.component.scss']
})
export class AddParticipantComponent extends AddParticipantBaseDirective implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
    constants = Constants;
    featureFlags = FeatureFlags;

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
    bookingHasParticipants: boolean;
    $subscriptions: Subscription[] = [];
    destroyed$ = new Subject<void>();

    interpreteeList: VHParticipant[] = [];
    showConfirmRemoveInterpretee = false;
    forceInterpretationLanguageSelection = false;
    interpreterSelection: InterpreterSelectedDto;

    @ViewChild(ParticipantListComponent, { static: true })
    participantsListComponent: ParticipantListComponent;

    public judiciaryRoles = Constants.JudiciaryRoles;

    constructor(
        private readonly searchService: SearchService,
        protected videoHearingService: VideoHearingsService,
        private readonly participantService: ParticipantService,
        protected router: Router,
        protected bookingService: BookingService,
        private readonly launchDarklyService: LaunchDarklyService,
        protected logger: Logger
    ) {
        super(bookingService, router, videoHearingService, logger);
        this.titleList = searchService.TitleList;
    }

    private get isInterpreterFormValid() {
        const includeInterpreter = this.interpreterForm ?? false;
        let interpreterFormValid = true;
        if (includeInterpreter) {
            interpreterFormValid = this.interpreterForm?.form.valid;
        }
        return interpreterFormValid;
    }

    ngOnInit() {
        this.launchDarklyService
            .getFlag<boolean>(FeatureFlags.interpreterEnhancements)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(flag => {
                this.interpreterEnhancementsFlag = flag;
            });
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
                .getHearingRoles()
                .then((data: HearingRoleResponse[]) => {
                    self.setupRolesWithoutCaseRole(data);
                    self.handleRoleSetupForEditMode(self);
                })
                .catch(error => this.logger.error(`${this.loggerPrefix} Error getting hearing roles.`, error));
        }, 500);
    }

    ngAfterContentInit() {
        if (this.editMode) {
            if (this.searchEmail && this.participantDetails) {
                this.setParticipantEmail();
                this.subscribeForSearchEmailEvents();
            }
        }
    }

    handleRoleSetupForEditMode(self: AddParticipantComponent) {
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
    }

    subscribeForSearchEmailEvents() {
        this.searchEmail.emailFoundEvent$.subscribe(() => {
            this.errorAlternativeEmail = false;
            this.errorJohAccountNotFound = false;
        });
        this.searchEmail.emailNotFoundEvent$.subscribe(() => {
            this.notFoundParticipant();
        });
    }

    private setParticipantEmail() {
        this.searchEmail.email = this.participantDetails.email;
        this.searchEmail.participantDetails = this.participantDetails;
        this.searchEmail.isValidEmail = true;
        const participantHasId = this.participantDetails.id && this.participantDetails.id.length > 0;
        this.emailDisabled = participantHasId || this.participantDetails.isExistPerson;
    }

    initialiseForm() {
        super.initialiseForm();

        const self = this;
        this.$subscriptions.push(
            this.form.valueChanges.subscribe(changes => {
                self.forceInterpretationLanguageSelection =
                    changes.role?.toLocaleLowerCase() !== HearingRoles.INTERPRETER.toLocaleLowerCase();

                setTimeout(() => {
                    if (
                        self.showDetails &&
                        self.role.value === self.constants.PleaseSelect &&
                        self.title.value === self.constants.PleaseSelect &&
                        self.firstName.value === '' &&
                        self.lastName.value === '' &&
                        self.phone.value === '' &&
                        self.displayName.value === ''
                    ) {
                        self.displayNext();
                    } else if (!self.showDetails && self.role.value === self.constants.PleaseSelect) {
                        self.displayNext();
                    } else if (self.showDetails && self.form.valid && self.searchEmail?.validateEmail()) {
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
            this.interpreterSelected = selectedParticipant.hearingRoleName.toLowerCase() === HearingRoles.INTERPRETER;

            this.logger.debug(`${this.loggerPrefix} Repopulating participant to edit.`, {
                hearing: this.hearing.hearingId,
                participant: selectedParticipant.id
            });

            this.getParticipant(selectedParticipant);
        }
    }

    private checkForExistingRequest() {
        this.hearing = this.videoHearingService.getCurrentRequest();
        if (this.hearing) {
            this.logger.debug(`${this.loggerPrefix} Found existing hearing.`, { hearing: this.hearing.hearingId });
            const anyParticipants = this.hearing.participants.find(x => !x.isJudge);
            if (this.editMode) {
                this.logger.debug(`${this.loggerPrefix} Mapping existing participants.`, { hearing: this.hearing.hearingId });
                this.bookingHasParticipants = anyParticipants && !anyParticipants.isJudge;
            }
        }
    }

    setupRolesWithoutCaseRole(data: HearingRoleResponse[]) {
        this.hearingRoles = this.participantService
            .mapParticipantHearingRoles(data)
            .filter(
                x =>
                    x.code !== Constants.HearingRoleCodes.Judge &&
                    x.code !== Constants.HearingRoleCodes.StaffMember &&
                    x.code !== Constants.HearingRoleCodes.PanelMember
            )
            .sort((a, b) => a.name.localeCompare(b.name));
        this.roleList = this.hearingRoles.map(x => x.name);
        this.roleList.unshift(this.constants.PleaseSelect);
        this.setupHearingRolesWithoutCaseRole();
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

    onRoleSelected($event) {
        $event.stopImmediatePropagation();
        this.roleSelected();
    }

    titleSelected() {
        this.isTitleSelected = this.title.value !== this.constants.PleaseSelect;
    }

    saveParticipant() {
        this.actionsBeforeSave();

        if (
            this.form.valid &&
            this.isInterpreterFormValid &&
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
            const newParticipant = new VHParticipant();

            if (this.participantDetails) {
                this.participantDetails.addedDuringHearing =
                    !this.videoHearingService.isConferenceClosed() && this.videoHearingService.isHearingAboutToStart();
            }

            this.mapParticipant(newParticipant);

            if (!this.participantService.checkDuplication(newParticipant.email, this.hearing.participants)) {
                this.addLinkedParticipant(newParticipant);

                this.hearing.participants.push(newParticipant);
                this.hearing.participants = [...this.hearing.participants];
                this.hearing = this.hearing.clone();

                this.populateInterpretedForList();
                this.videoHearingService.updateHearingRequest(this.hearing);
                this.logger.debug(`${this.loggerPrefix} Saved participant to booking. Clearing form.`, {
                    hearing: this.hearing?.hearingId,
                    participant: newParticipant.id,
                    existingPerson: newParticipant.isExistPerson,
                    email: newParticipant.email,
                    username: newParticipant.username
                });
                this.participantDetails = null;
                this.clearForm();

                // Refresh the list in case an interpreter can now be added
                this.setupHearingRolesWithoutCaseRole();

                this.displayNext();
                this.form.markAsPristine();
                this.showDetails = false;
            } else {
                this.logger.warn(`${this.loggerPrefix} Cannot save existing participant to booking`, {
                    hearing: this.hearing?.hearingId,
                    participant: newParticipant.id,
                    existingPerson: newParticipant.isExistPerson,
                    email: newParticipant.email,
                    username: newParticipant.username
                });
                this.showConfirmationPopup = true;
                this.confirmationMessage = `You have already added ${newParticipant.firstName} ${newParticipant.lastName} to this hearing`;
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
            if (
                this.form.valid &&
                this.isInterpreterFormValid &&
                this.validEmail() &&
                this.isRoleSelected &&
                this.isTitleSelected &&
                !this.errorAlternativeEmail
            ) {
                this.isShowErrorSummary = false;
                this.hearing.participants.forEach(newParticipant => {
                    if (newParticipant.email === this.selectedParticipantEmail) {
                        this.mapParticipant(newParticipant);
                        this.updateLinkedParticipant(newParticipant);
                    }
                });
                this.hearing.participants = [...this.hearing.participants];
                this.hearing = this.hearing.clone();
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
        this.interpreterForm?.forceValidation();
    }

    confirmRemoveParticipant() {
        if (this.selectedParticipantEmail) {
            const participant = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
            const title = participant?.title ? `${participant.title}` : '';
            this.removerFullName = participant ? `${title} ${participant.firstName} ${participant.lastName}` : '';
            const anyParticipants = this.hearing.participants.filter(x => !x.isJudge);
            this.bookingHasParticipants = anyParticipants && anyParticipants.length > 1;

            const isInterpretee =
                (participant.linkedParticipants &&
                    participant.linkedParticipants.length > 0 &&
                    participant.hearingRoleName.toLowerCase() !== HearingRoles.INTERPRETER) ||
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
        this.hearing = this.hearing.clone();
        this.videoHearingService.updateHearingRequest(this.hearing);
        this.videoHearingService.setBookingHasChanged();
    }

    mapParticipant(newParticipant: VHParticipant) {
        newParticipant.firstName = this.firstName.value;
        newParticipant.lastName = this.lastName.value;
        newParticipant.phone = this.phone.value;
        newParticipant.title = this.title.value === this.constants.PleaseSelect ? null : this.title.value;

        newParticipant.hearingRoleName = this.role.value;
        newParticipant.hearingRoleCode = this.hearingRoles.find(h => h.name === this.role.value)?.code;

        newParticipant.email = this.searchEmail ? this.searchEmail.email : '';
        newParticipant.displayName = this.displayName.value;
        if (this.isRoleRepresentative(this.role.value)) {
            newParticipant.company = this.companyName.value;
        } else {
            newParticipant.company = this.companyNameIndividual.value;
        }
        newParticipant.username = this.participantDetails ? this.participantDetails.username : '';
        newParticipant.representee = this.representing.value;
        newParticipant.isExistPerson = this.existingPersonEmails.findIndex(x => x === newParticipant.email) > -1;
        newParticipant.interpreterFor = this.interpreterFor.value === this.constants.PleaseSelect ? null : this.interpreterFor.value;
        newParticipant.linkedParticipants = this.addUpdateLinkedParticipant(newParticipant);
        newParticipant.userRoleName = this.getUserRoleName(newParticipant);
        newParticipant.addedDuringHearing = this.participantDetails?.addedDuringHearing;
        if (this.interpreterSelection?.interpreterRequired) {
            newParticipant.interpretation_language = {
                interpreterRequired: true,
                signLanguageCode: this.interpreterSelection.signLanguageCode,
                signLanguageDescription: this.interpreterSelection.signLanguageDescription,
                spokenLanguageCode: this.interpreterSelection.spokenLanguageCode,
                spokenLanguageCodeDescription: this.interpreterSelection.spokenLanguageCodeDescription
            };
        } else {
            newParticipant.interpretation_language = {
                interpreterRequired: false
            };
        }
    }

    private getUserRoleName(newParticipant: VHParticipant): string {
        return this.hearingRoles.find(h => h.name === newParticipant.hearingRoleName)?.userRole;
    }

    private addUpdateLinkedParticipant(newParticipant: VHParticipant): LinkedParticipantModel[] {
        return newParticipant.hearingRoleName.toLowerCase() === HearingRoles.INTERPRETER && !this.interpreterEnhancementsFlag
            ? this.updateLinkedParticipantList(newParticipant)
            : [];
    }

    private updateLinkedParticipantList(newParticipant: VHParticipant): LinkedParticipantModel[] {
        if (this.editMode) {
            return this.updateNewParticipantToLinkedParticipant(newParticipant);
        } else {
            return this.addNewParticipantToLinkedParticipant(newParticipant);
        }
    }

    private updateNewParticipantToLinkedParticipant(newParticipant: VHParticipant): LinkedParticipantModel[] {
        if (this.localEditMode) {
            const linkedParticipant = newParticipant.linkedParticipants[0];
            const interpretee = this.hearing.participants.find(p => p.id === linkedParticipant.linkedParticipantId);
            interpretee.linkedParticipants = [];
            linkedParticipant.linkedParticipantId = this.getInterpreteeId(newParticipant.interpreterFor);
            linkedParticipant.linkedParticipantEmail = newParticipant.interpreterFor;
            linkedParticipant.participantEmail = newParticipant.email;
            linkedParticipant.participantId = newParticipant.id;
            return [linkedParticipant];
        } else {
            return this.addNewParticipantToLinkedParticipant(newParticipant);
        }
    }

    private addNewParticipantToLinkedParticipant(newParticipant: VHParticipant): LinkedParticipantModel[] {
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
        this.interpreterForm?.form.reset();
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
        return this.hearing.participants?.length > 0 || this.hearing.judiciaryParticipants.length > 0;
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

    populateInterpretedForList() {
        this.interpreteeList = this.hearing.participants.filter(
            p => p.userRoleName === 'Individual' && p.hearingRoleName !== Constants.HearingRoles.Interpreter && !this.isAnObserver(p)
        );

        const interpreteeModel = new VHParticipant({
            id: this.constants.PleaseSelect,
            firstName: this.constants.PleaseSelect,
            lastName: '',
            email: this.constants.PleaseSelect,
            isExistPerson: false,
            isCourtroomAccount: false,
            isJudiciaryMember: false,
            interpretation_language: null
        });

        this.interpreteeList.unshift(interpreteeModel);
    }

    onInterpreterLanguageSelected($event: InterpreterSelectedDto) {
        this.interpreterSelection = $event;
        if (!$event.interpreterRequired) {
            this.interpreterSelection = null;
        }
    }

    private removeInterpreteeAndInterpreter() {
        // check if participant details were populated, if yes then clean form.
        if (this.searchEmail && this.searchEmail.email === this.selectedParticipantEmail) {
            this.clearForm();
        }
        const interpretee = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
        let interpreter: VHParticipant;
        if (interpretee.linkedParticipants && interpretee.linkedParticipants.length > 0) {
            interpreter = this.hearing.participants.find(i => i.id === interpretee.linkedParticipants[0].linkedParticipantId);
        } else {
            interpreter = this.hearing.participants.find(i => i.interpreterFor === this.selectedParticipantEmail);
        }
        if (interpreter) {
            this.participantService.removeParticipant(this.hearing, interpreter.email);
        }
        this.participantService.removeParticipant(this.hearing, this.selectedParticipantEmail);
        this.removeLinkedParticipant(this.selectedParticipantEmail);
        this.hearing = this.hearing.clone();
        this.videoHearingService.updateHearingRequest(this.hearing);
        this.videoHearingService.setBookingHasChanged();
    }

    private addLinkedParticipant(newParticipant: VHParticipant): void {
        if (newParticipant.interpreterFor) {
            const interpretee = this.getInterpretee(newParticipant.interpreterFor);
            newParticipant.interpreteeName = interpretee.displayName;
            const linkedParticipant: LinkedParticipantModel = {
                participantEmail: newParticipant.email,
                linkedParticipantEmail: interpretee.email,
                linkType: LinkedParticipantType.Interpreter
            };
            this.hearing.linkedOarticipants.push(linkedParticipant);
        }
    }

    private updateLinkedParticipant(newParticipant: VHParticipant): void {
        this.hearing.linkedOarticipants = [];
        this.addLinkedParticipant(newParticipant);
    }

    private removeLinkedParticipant(email: string): void {
        // removes both the linked participants.
        const interpreterExists = this.hearing.linkedOarticipants.some(p => p.participantEmail === email);
        const interpreteeExists = this.hearing.linkedOarticipants.some(p => p.linkedParticipantEmail === email);
        if (interpreterExists || interpreteeExists) {
            this.hearing.linkedOarticipants = [];
        }
    }

    private getInterpretee(email: string): VHParticipant {
        return this.hearing.participants.find(p => p.email === email);
    }
}
