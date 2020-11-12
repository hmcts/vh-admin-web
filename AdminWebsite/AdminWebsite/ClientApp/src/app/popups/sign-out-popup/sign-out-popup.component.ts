import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-sign-out-popup',
    templateUrl: './sign-out-popup.component.html'
})
export class SignOutPopupComponent implements OnInit {
    @Output() continue: EventEmitter<any>;
    @Output() signOut: EventEmitter<any>;

    constructor() {
        this.continue = new EventEmitter<any>();
        this.signOut = new EventEmitter<any>();
    }

    ngOnInit() {}

    continueBooking() {
        this.continue.emit();
    }

    logout() {
        this.signOut.emit();
    }
}
