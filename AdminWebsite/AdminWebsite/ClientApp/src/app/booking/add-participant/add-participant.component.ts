import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Constants } from '../../common/constants';
import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import { IDropDownModel } from '../../common/model/drop-down.model';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';

import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ParticipantService } from '../services/participant.service';
import {CaseRoleResponse} from '../../services/clients/api-client';

@Component({
  selector: 'app-add-participant',
  templateUrl: './add-participant.component.html',
  styleUrls: ['./add-participant.component.css'],
})
export class AddParticipantComponent extends BookingBaseComponent implements OnInit, CanDeactiveComponent {
  canNavigate = true;
  constants = Constants;

  participantDetails: ParticipantModel;
  notFound: boolean;
  hearing: HearingModel;
  participants: ParticipantModel[] = [];
  titleList: IDropDownModel[] = [];
  roleList: CaseRoleResponse[];
  selectedParticipantEmail: string = null;
  participantForm: FormGroup;
  private role: FormControl;
  private title: FormControl;
  private firstName: FormControl;
  private lastName: FormControl;
  private phone: FormControl;
  private displayName: FormControl;
  isRoleSelected = true;
  isTitleSelected = true;
  isShowErrorSummary = false;

  showCancelPopup = false;
  showConfirmationPopup = false;
  confirmationMessage: string;
  showConfirmationRemoveParticipant = false;
  removerFullName: string;

  displayNextButton = true;
  displayAddButton = false;
  displayClearButton = false;
  displayErrorNoParticipants = false;

  @ViewChild(SearchEmailComponent)
  searchEmail: SearchEmailComponent;

  @ViewChild(ParticipantsListComponent)
  participantsListComponent: ParticipantsListComponent;

  constructor(
    private searchService: SearchService,
    private videoHearingService: VideoHearingsService,
    private participantService: ParticipantService,
    protected router: Router,
    protected bookingService: BookingService) {

    super(bookingService, router);
    this.checkForExistingRequest();
    this.retrieveRoles();
    this.titleList = searchService.TitleList;
  }

  private repopulateParticipantToEdit() {
    const selectedParticipant = this.participants.find(s => s.email === this.selectedParticipantEmail);
    this.getParticipant(selectedParticipant);
    this.searchEmail.email = selectedParticipant.email;
    this.searchEmail.isValidEmail = true;
  }

  private checkForExistingRequest() {
    this.hearing = this.videoHearingService.getCurrentRequest();
  }

  private retrieveRoles() {
    this.videoHearingService.getParticipantRoles()
      .subscribe(
        (data: CaseRoleResponse[]) => {
          this.setupRoles(data);
        },
        error => console.error(error)
      );
  }

  setupRoles(data: CaseRoleResponse[]) {
    const rolesToIgnore = ['Judge', 'Clerk', 'Administrator'];
    this.roleList = data.filter(x => rolesToIgnore.indexOf(x.name) === -1);
    const firstItem = new CaseRoleResponse({ name: this.constants.PleaseSelect });
    this.roleList.unshift(firstItem);
  }

  public getParticipant(participantDetails) {
    this.displayErrorNoParticipants = false;
    this.displayAdd();

    this.participantDetails = participantDetails;
    this.participantForm.setValue({
      role: this.participantDetails.hearing_role_name,
      party: this.participantDetails.case_role_name,
      title: this.participantDetails.title,
      firstName: this.participantDetails.first_name,
      lastName: this.participantDetails.last_name,
      phone: this.participantDetails.phone,
      displayName: this.participantDetails.display_name
    });
  }

  notFoundParticipant() {
    this.displayErrorNoParticipants = false;
    this.displayClear();
  }

  emailChanged() {
    if (this.participantForm.valid && this.searchEmail.validateEmail()) {
      if (this.editMode) {
        this.displayNext();
      } else {
        this.displayAdd();
      }
    }
  }

  ngOnInit() {
    super.ngOnInit();
    this.hearing = this.videoHearingService.getCurrentRequest();
    if (this.hearing) {
      this.participants = this.participantService.getAllParticipants(this.hearing);
    }
    this.initializeForm();
    if (this.editMode) {
      this.selectedParticipantEmail = this.bookingService.getParticipantEmail();
      this.repopulateParticipantToEdit();
      this.displayNext();
    }

    if (this.participantsListComponent) {
      this.participantsListComponent.selectedParticipant.subscribe((participantEmail) => {
        this.selectedParticipantEmail = participantEmail;
        this.repopulateParticipantToEdit();
      });

      this.participantsListComponent.selectedParticipantToRemove.subscribe((participantEmail) => {
        this.selectedParticipantEmail = participantEmail;
        this.confirmRemoveParticipant();
      });
    }
  }

  initializeForm() {
    this.role = new FormControl(this.constants.PleaseSelect, [
      Validators.required,
      Validators.pattern(this.constants.PleaseSelectPattern)
    ]);
    this.title = new FormControl(this.constants.PleaseSelect, [
      Validators.required,
      Validators.pattern(this.constants.PleaseSelectPattern)
    ]);
    this.firstName = new FormControl('', Validators.required);
    this.lastName = new FormControl('', Validators.required);
    this.phone = new FormControl('', [Validators.required, Validators.pattern(/^[0-9) -.]+$/)]);
    this.displayName = new FormControl('');
    this.participantForm = new FormGroup({
      role: this.role,
      title: this.title,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      displayName: this.displayName,
    });
    this.participantForm.valueChanges.subscribe(
      result => {
        if ((this.role.value === this.constants.PleaseSelect &&
          this.title.value === this.constants.PleaseSelect &&
          this.firstName.value === '' &&
          this.lastName.value === '' &&
          this.phone.value === '' &&
          this.displayName.value === '') || this.editMode) {
          this.displayNext();
        } else if (this.participantForm.valid && this.searchEmail.validateEmail()) {
          this.displayAdd();
        } else {
          this.displayClear();
        }
      });
  }

  private displayAdd() {
    this.displayNextButton = false;
    this.displayClearButton = true;
    this.displayAddButton = true;
  }

  private displayNext() {
    this.displayNextButton = true;
    this.displayClearButton = false;
    this.displayAddButton = false;
  }
  private displayClear() {
    this.displayNextButton = false;
    this.displayClearButton = true;
    this.displayAddButton = false;
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

  get titleInvalid() {
    return this.title.invalid && (this.title.dirty || this.title.touched || this.isShowErrorSummary);
  }

  roleSelected() {
    this.isRoleSelected = this.role.value !== this.constants.PleaseSelect;
  }

  titleSelected() {
    this.isTitleSelected = this.title.value !== this.constants.PleaseSelect;
  }

  get emailInvalid() {
    return this.searchEmail.validateEmail();
  }

  get displayNameInvalid() {
    return this.displayName.invalid && (this.displayName.dirty || this.displayName.touched || this.isShowErrorSummary);
  }

  showErrorSummary() {
    return !this.participantForm.valid || !this.isRoleSelected || !this.isTitleSelected;
  }

  saveParticipant() {
    const validEmail = this.searchEmail.validateEmail();
    this.actionsBeforeSave();
    if (this.participantForm.valid && validEmail && this.isRoleSelected && this.isTitleSelected) {
      this.isShowErrorSummary = false;
      const newParticipant = new ParticipantModel();
      this.mapParticipant(newParticipant);
      if (!this.participantService.checkDuplication(newParticipant.email, this.participants)) {
        this.participants.push(newParticipant);
        this.addToFeed(newParticipant);
        this.clearForm();
        this.displayNext();
        this.participantForm.markAsPristine();
      } else {
        this.showConfirmationPopup = true;
        this.confirmationMessage = `You have already added ${newParticipant.first_name} ${newParticipant.last_name} to this hearing`;
      }
    } else {
      this.isShowErrorSummary = true;
    }
  }

  updateParticipant() {
    const validEmail = this.searchEmail.validateEmail();
    this.actionsBeforeSave();
    if (this.participantForm.valid && validEmail && this.isRoleSelected && this.isTitleSelected) {
      this.isShowErrorSummary = false;
      console.log('update participant');
      this.participants.forEach(newParticipant => {
        if (newParticipant.email === this.selectedParticipantEmail) {
          this.mapParticipant(newParticipant);
          this.addToFeed(newParticipant);
        }
      });
      this.clearForm();
      this.participantForm.markAsPristine();
    } else {
      this.isShowErrorSummary = true;
    }
  }

  actionsBeforeSave() {
    this.roleSelected();
    this.role.markAsTouched();
    this.firstName.markAsTouched();
    this.lastName.markAsTouched();
    this.phone.markAsTouched();
  }

  confirmRemoveParticipant() {
    const participant =  this.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
    this.removerFullName = participant ? `${participant.title} ${participant.first_name} ${participant.last_name}` : '';
    this.showConfirmationRemoveParticipant = true;
  }

  removeParticipant() {
    this.participantService.removeParticipant(this.participants, this.hearing, this.selectedParticipantEmail);
    this.videoHearingService.updateHearingRequest(this.hearing);
  }

  mapParticipant(newParticipant: ParticipantModel) {
    newParticipant.first_name = this.firstName.value;
    newParticipant.last_name = this.lastName.value;
    newParticipant.phone = this.phone.value;
    newParticipant.title = this.title.value;
    newParticipant.case_role_name = this.party.value;
    newParticipant.hearing_role_name = this.role.value;
    newParticipant.email = this.searchEmail.email;
    newParticipant.display_name = this.displayName.value;
  }

  addToFeed(newParticipant) {
    this.participantService.addToFeed(newParticipant, this.hearing);
    this.videoHearingService.updateHearingRequest(this.hearing);
  }

  addParticipantCancel() {
    if (this.editMode) {
      this.navigateToSummary();
    } else {
      this.showCancelPopup = true;
    }
  }

  handleContinueBooking(event: any) {
    this.showCancelPopup = false;
  }

  handleCancelBooking(event: any) {
    this.showCancelPopup = false;
    this.participantForm.reset();
    this.router.navigate(['/dashboard']);
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
    this.participants = this.participantService.getAllParticipants(this.hearing);
  }

  clearForm() {
    this.participantForm.setValue(
      {
        role: this.constants.PleaseSelect,
        title: this.constants.PleaseSelect,
        firstName: '',
        lastName: '',
        phone: '',
        displayName: ''
      });
    this.role.markAsUntouched();
    this.firstName.markAsUntouched();
    this.lastName.markAsUntouched();
    this.phone.markAsUntouched();
    this.title.markAsUntouched();
    this.searchEmail.clearEmail();
    this.displayName.markAsUntouched();
  }

  next() {
    if (this.participants && this.participants.length > 0) {
      if (this.editMode) {
        this.updateParticipant();
        if (this.isShowErrorSummary) {
          return;
        }
        this.navigateToSummary();
      } else {
        this.router.navigate(['/other-information']);
      }
    } else {
      this.displayErrorNoParticipants = true;
    }
  }

  hasChanges(): Observable<boolean> | boolean {
    if (this.participantForm.dirty) {
      this.showCancelPopup = true;
    }
    return this.participantForm.dirty;
  }

  goToDiv(fragment: string): void {
    window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
  }
}
