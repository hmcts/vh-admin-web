import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-discard-confirm-popup',
  templateUrl: './discard-confirm-popup.component.html',
})
export class DiscardConfirmPopupComponent {
  @Output() continueEditing: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancelChanges: EventEmitter<any> = new EventEmitter<any>();

  continueEditingBooking() {
    this.continueEditing.emit();
  }

  cancelBookingChanges() {
    this.cancelChanges.emit();
  }
}
