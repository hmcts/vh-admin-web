import { Injectable } from '@angular/core';
import { Constants } from '../common/constants';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private participantEmailKey: string;
  private existingCaseTypeKey: string;

  constructor() {
    this.participantEmailKey = 'participantEmailKey';
    this.existingCaseTypeKey = 'selectedCaseType';

  }

  setEditMode() {
    sessionStorage.setItem(Constants.bookingEditKey, Constants.bookingEditKey);
  }

  resetEditMode() {
    sessionStorage.removeItem(Constants.bookingEditKey);
    sessionStorage.removeItem(this.existingCaseTypeKey);
  }

  isEditMode(): boolean {
    const editMode = sessionStorage.getItem(Constants.bookingEditKey);
    return editMode === Constants.bookingEditKey;
  }

  setParticipantEmail(participantEmail: string) {
    sessionStorage.setItem(this.participantEmailKey, participantEmail);
  }

  getParticipantEmail() {
    return sessionStorage.getItem(this.participantEmailKey);
  }

  removeParticipantEmail() {
    sessionStorage.removeItem(this.participantEmailKey);
  }

  isParticipantEmail(): boolean {
    const participantEmail = sessionStorage.getItem(this.participantEmailKey);
    return participantEmail && participantEmail.length > 0;
  }

  setExistingCaseType(selectedCaseType: string) {
    sessionStorage.setItem(this.existingCaseTypeKey, selectedCaseType);
  }

  removeExistingCaseType() {
    sessionStorage.removeItem(this.existingCaseTypeKey);
  }
}
