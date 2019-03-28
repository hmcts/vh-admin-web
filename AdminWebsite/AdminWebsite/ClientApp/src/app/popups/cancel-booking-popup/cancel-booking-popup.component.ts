import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-cancel-booking-popup',
  templateUrl: './cancel-booking-popup.component.html',
  styleUrls: ['./cancel-booking-popup.component.css']
})
export class CancelBookingPopupComponent implements OnInit {
  @Output() cancelBooking: EventEmitter<any> = new EventEmitter<any>();
  @Output() keepBooking: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }
  ngOnInit() {
  }

  cancelHearing(): void {
    this.cancelBooking.emit();
  }

  keepHearing(): void {
    this.keepBooking.emit();
  }
}
