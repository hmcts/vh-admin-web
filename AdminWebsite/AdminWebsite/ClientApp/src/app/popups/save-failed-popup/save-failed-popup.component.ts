import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-save-failed-popup',
  templateUrl: './save-failed-popup.component.html',
  styleUrls: ['./save-failed-popup.component.css']
})
export class SaveFailedPopupComponent implements OnInit {
  @Output() continueBooking: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancelSave: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

  saveBooking() {
    this.continueBooking.emit();
  }

  cancelBooking() {
    this.cancelSave.emit();
  }

}
