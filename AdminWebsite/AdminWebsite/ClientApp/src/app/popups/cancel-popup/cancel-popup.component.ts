import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';

@Component({
  selector: 'app-cancel-popup',
  templateUrl: './cancel-popup.component.html',
  styleUrls: ['./cancel-popup.component.css']
})
export class CancelPopupComponent implements OnInit {
  @Output() continueBooking: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancelBooking: EventEmitter<any> = new EventEmitter<any>();

  @Input()
  message = 'Are you sure you want to discard them?';

  constructor() { }

  ngOnInit() {
  }

  continueAddParticipant() {
    this.continueBooking.emit();
  }

  cancelBookingHearing() {
    this.cancelBooking.emit();
  }
}
