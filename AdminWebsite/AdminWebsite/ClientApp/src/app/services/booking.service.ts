import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingEditKey: string;
  constructor() {
    this.bookingEditKey='bookingEditKey';
  }

  setEditMode() {
    sessionStorage.setItem(this.bookingEditKey, this.bookingEditKey);
  }

  resetEditMode() {
    sessionStorage.removeItem(this.bookingEditKey);
  }

  isEditMode():boolean {
    let editMode = sessionStorage.getItem(this.bookingEditKey);
    return editMode === this.bookingEditKey;
  }
}
