import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-confirm-booking-failed-popup',
    templateUrl: './confirm-booking-failed-popup.component.html'
})
export class ConfirmBookingFailedPopupComponent implements OnInit {
    @Output() close: EventEmitter<any> = new EventEmitter<any>();

    constructor() {}
    ngOnInit() {}

    ok(): void {
        this.close.emit();
    }
}
