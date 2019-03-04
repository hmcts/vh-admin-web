import { Component, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-sign-out',
  templateUrl: 'sign-out.component.html',
  styleUrls:['sign-out.component.css']
})
export class SignOutComponent {

  $confirmLogout: EventEmitter<any>;

  constructor() {
    this.$confirmLogout = new EventEmitter();
  }

  signout() {
    this.$confirmLogout.emit(true);
  }

  get confirmLogout() {
    return this.$confirmLogout;
  }
}
