import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-sign-out-popup',
    template: '',
    standalone: false
})
export class SignOutPopupStubComponent {
    @Output() continue: EventEmitter<any> = new EventEmitter<any>();
    @Output() signOut: EventEmitter<any> = new EventEmitter<any>();
}
