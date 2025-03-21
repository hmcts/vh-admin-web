import { Component, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-sign-out',
    template: '',
    standalone: false
})
export class SignOutStubComponent {
    $confirmLogout: EventEmitter<any>;
    constructor() {
        this.$confirmLogout = new EventEmitter();
    }
    get confirmLogout() {
        return this.$confirmLogout;
    }
}
