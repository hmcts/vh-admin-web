import { Component, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TopMenuItems } from './topMenuItems';
import { SignOutComponent } from '../sign-out/sign-out.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @ViewChild(SignOutComponent)
  signoutComponent: SignOutComponent;

  $confirmLogout: EventEmitter<any>;

  topMenuItems = [];

  constructor(private router: Router) {
    this.$confirmLogout = new EventEmitter();
  }

  selectMenuItem(indexOfItem: number) {
    for (const item of this.topMenuItems) {
      item.active = false;
    }
    this.topMenuItems[indexOfItem].active = true;
    this.router.navigate([this.topMenuItems[indexOfItem].url]);
  }

  ngOnInit() {
    this.topMenuItems = TopMenuItems;
    this.signoutComponent.confirmLogout.subscribe(() => { this.logout() });
  }

  logout() {
    this.$confirmLogout.emit();
  }

  get confirmLogout() {
    return this.$confirmLogout;
  }
}
