import { Component, OnInit, EventEmitter, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TopMenuItems } from './topMenuItems';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() loggedIn: boolean;

  $confirmLogout: EventEmitter<any>;
  $confirmSaveBooking: EventEmitter<any>;

  topMenuItems = [];

  constructor(private router: Router) {
    this.$confirmLogout = new EventEmitter();
    this.$confirmSaveBooking = new EventEmitter();
   }

  selectMenuItem(indexOfItem: number) {
    // confirmation to save a booking changes before navigate away.
    this.$confirmSaveBooking.emit(indexOfItem);
  }

  navigateToSelectedMenuItem(indexOfItem: number) {
    for (const item of this.topMenuItems) {
      item.active = false;
    }
    this.topMenuItems[indexOfItem].active = true;
    this.router.navigate([this.topMenuItems[indexOfItem].url]);
  }

  ngOnInit() {
    this.topMenuItems = TopMenuItems;
   }

  logout() {
    this.$confirmLogout.emit();
  }

  logoClick() {
    // navigate to dashboard
    this.$confirmSaveBooking.emit(0);
  }

  get confirmLogout() {
    return this.$confirmLogout;
  }

  get confirmSaveBooking() {
    return this.$confirmSaveBooking;
  }
}
