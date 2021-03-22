import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-cancel-booking-failed-popup',
    templateUrl: './cancel-booking-failed-popup.component.html',
    styleUrls: ['./cancel-booking-failed-popup.component.css']
})
export class CancelBookingFailedPopupComponent {
    @Output() popupClose: EventEmitter<boolean> = new EventEmitter<boolean>();

    close() {
        this.popupClose.emit(true);
    }
}
