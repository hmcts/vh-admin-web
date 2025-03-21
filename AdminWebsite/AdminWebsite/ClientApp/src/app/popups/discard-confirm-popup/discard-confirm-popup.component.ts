import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-discard-confirm-popup',
    templateUrl: './discard-confirm-popup.component.html',
    standalone: false
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
