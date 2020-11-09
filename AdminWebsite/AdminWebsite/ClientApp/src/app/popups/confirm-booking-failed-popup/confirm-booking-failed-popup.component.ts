import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-confirm-booking-failed-popup',
    templateUrl: './confirm-booking-failed-popup.component.html'
})
export class ConfirmBookingFailedPopupComponent implements OnInit {
    @Output() close: EventEmitter<any> = new EventEmitter<any>();
    @Input() hearingId: string;

    errorDateTime: string;
    constructor() {}
    ngOnInit() {
        this.errorDateTime = new Date().toUTCString();
    }

    ok(): void {
        this.close.emit();
    }
}
