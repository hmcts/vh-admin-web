import { Component, EventEmitter } from '@angular/core';

@Component({ selector: 'app-header', template: '' })
export class HeaderStubComponent {
  $confirmLogout: EventEmitter<any> = new EventEmitter();
  get confirmLogout() {
    return this.$confirmLogout;
  }
}
