import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingEditKey: string;
  private participantEmailKey: string;
  constructor() {
    this.bookingEditKey = 'bookingEditKey';
    this.participantEmailKey = 'participantEmailKey';
  }

  setEditMode() {
    sessionStorage.setItem(this.bookingEditKey, this.bookingEditKey);
  }

  resetEditMode() {
    sessionStorage.removeItem(this.bookingEditKey);
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

}
