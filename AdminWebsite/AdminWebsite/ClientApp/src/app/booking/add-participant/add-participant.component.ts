import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';

import { Constants } from '../../common/constants';
import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import { IDropDownModel } from '../../common/model/drop-down.model';
import {
  IParticipantRoleResponse,
  ParticipantRoleResponse,
} from '../../services/clients/api-client';
import { HearingModel, FeedModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';

import { SearchService } from '../../services/search.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';

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
  roleList: IParticipantRoleResponse[];
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

  displayNextButton = true;
  displayAddButton = false;
  displayClearButton = false;
  displayErrorNoParticipants = false;

  @ViewChild(SearchEmailComponent)
  searchEmail: SearchEmailComponent;

  @ViewChild(CancelPopupComponent)
  cancelPopup: CancelPopupComponent;

  @ViewChild(ParticipantsListComponent)
  participantsListComponent: ParticipantsListComponent;

  constructor(
    private searchService: SearchService,
    private videoHearingService: VideoHearingsService,
    protected router: Router,
    protected bookingService: BookingService) {
    super(bookingService, router);
    this.checkForExistingRequest();
    this.retrieveRoles();
    this.titleList = searchService.TitleList;
  }

  private repopulateParticipantToEdit() {
    let selectedParticipant = this.participants.find(s => s.email === this.selectedParticipantEmail);
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
        (data: ParticipantRoleResponse[]) => {
          this.setupRoles(data);
        },
        error => console.error(error)
      );
  }

  setupRoles(data: ParticipantRoleResponse[]) {
    const rolesToIgnore = ['Judge', 'Clerk', 'Administrator'];
    this.roleList = data.filter(x => rolesToIgnore.indexOf(x.name) === -1);
    const firstItem = new ParticipantRoleResponse({ name: this.constants.PleaseSelect });
    this.roleList.unshift(firstItem);
  }

  public getParticipant(participantDetails) {
    this.displayErrorNoParticipants = false;
    this.displayAdd();

    this.participantDetails = participantDetails;
    this.participantForm.setValue({
      role: this.participantDetails.role,
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
      this.displayAdd();
    }
  }

  ngOnInit() {
    super.ngOnInit();
    this.hearing = this.videoHearingService.getCurrentRequest();
    if (this.hearing) {
      this.participants = this.getAllParticipants();
    }
    this.initializeForm();
    if (this.editMode) {
      this.selectedParticipantEmail = this.bookingService.getParticipantEmail();
      this.repopulateParticipantToEdit();
      this.displayNext();
    }

    this.participantsListComponent.selectedParticipant.subscribe((participantEmail) => {
      this.selectedParticipantEmail = participantEmail;
      this.repopulateParticipantToEdit();
    });
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
    this.roleSelected();
    this.role.markAsTouched();
    this.firstName.markAsTouched();
    this.lastName.markAsTouched();
    this.phone.markAsTouched();
    if (this.participantForm.valid && validEmail && this.isRoleSelected && this.isTitleSelected) {
      this.isShowErrorSummary = false;
      const newParticipant = new ParticipantModel();
      newParticipant.first_name = this.firstName.value;
      newParticipant.last_name = this.lastName.value;
      newParticipant.phone = this.phone.value;
      newParticipant.title = this.title.value;
      newParticipant.role = this.role.value;
      newParticipant.email = this.searchEmail.email;
      newParticipant.display_name = this.displayName.value;
      if (!this.checkDuplication(newParticipant.email)) {
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
    this.roleSelected();
    this.role.markAsTouched();
    this.firstName.markAsTouched();
    this.lastName.markAsTouched();
    this.phone.markAsTouched();
    if (this.participantForm.valid && validEmail && this.isRoleSelected && this.isTitleSelected) {
      this.isShowErrorSummary = false;

      const newParticipant = new ParticipantModel();
      newParticipant.first_name = this.firstName.value;
      newParticipant.last_name = this.lastName.value;
      newParticipant.phone = this.phone.value;
      newParticipant.title = this.title.value;
      newParticipant.role = this.role.value;
      newParticipant.email = this.searchEmail.email;
      newParticipant.display_name = this.displayName.value;
      if (!this.checkDuplication(newParticipant.email)) {
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

  addToFeed(newParticipant) {
    let participantFeed = this.getExistingFeedWith(newParticipant.email);
    if (participantFeed) {
      participantFeed.participants = [];
    } else {
      participantFeed = new FeedModel(newParticipant.email);
      if (this.hearing.feeds) {
        this.hearing.feeds.push(participantFeed);
      }
    }
    participantFeed.participants.push(newParticipant);
    this.videoHearingService.updateHearingRequest(this.hearing);
  }

  private getExistingFeedWith(email: string): FeedModel {
    return this.hearing.feeds ?
      this.hearing.feeds.find(x => x.participants.filter(y => y.email.toLowerCase() === email.toLowerCase()).length > 0)
      : null;
  }

  private checkDuplication(email) {
    let existParticipant = false;
    if (this.participants.length > 0) {
      const part = this.participants.find(s => s.email === email);
      if (part) {
        existParticipant = true;
      }
    }
    return existParticipant;
  }

  addParticipantCancel() {
    this.showCancelPopup = true;
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
      this.router.navigate(['/other-information']);
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

  public getAllParticipants(): ParticipantModel[] {
    console.debug('getting all participants...');
    console.debug(this.hearing.feeds);
    let participants: ParticipantModel[] = [];
    this.hearing.feeds.forEach(x => {
      if (x.participants && x.participants.length >= 1) {
        participants = participants.concat(x.participants);
      }
    });
    return participants;
  }
}
