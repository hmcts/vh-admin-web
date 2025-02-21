import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-sign-out-popup',
    templateUrl: './sign-out-popup.component.html',
    standalone: false
})
export class SignOutPopupComponent {
    @Output() continue: EventEmitter<any>;
    @Output() signOut: EventEmitter<any>;

    constructor() {
        this.continue = new EventEmitter<any>();
        this.signOut = new EventEmitter<any>();
    }

    continueBooking() {
        this.continue.emit();
    }

    logout() {
        this.signOut.emit();
    }
}
