import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingEditKey: string;
  private participantEmailKey: string;
  private existingCaseTypeKey: string;

  constructor() {
    this.bookingEditKey = 'bookingEditKey';
    this.participantEmailKey = 'participantEmailKey';
    this.existingCaseTypeKey = 'selectedCaseType';

  }

  setEditMode() {
    sessionStorage.setItem(this.bookingEditKey, this.bookingEditKey);
  }

  resetEditMode() {
    sessionStorage.removeItem(this.bookingEditKey);
    sessionStorage.removeItem(this.existingCaseTypeKey);
  }

  isEditMode(): boolean {
    const editMode = sessionStorage.getItem(this.bookingEditKey);
    return editMode === this.bookingEditKey;
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
