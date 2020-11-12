import { Component, EventEmitter, Input } from '@angular/core';

@Component({ selector: 'app-header', template: '' })
export class HeaderStubComponent {
    @Input() loggedIn: boolean;
    $confirmLogout: EventEmitter<any> = new EventEmitter();
    get confirmLogout() {
        return this.$confirmLogout;
    }
}
