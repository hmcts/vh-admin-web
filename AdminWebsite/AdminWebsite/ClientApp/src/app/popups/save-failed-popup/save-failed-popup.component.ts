import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-save-failed-popup',
  templateUrl: './save-failed-popup.component.html',
  styleUrls: ['./save-failed-popup.component.css']
})
export class SaveFailedPopupComponent implements OnInit {
  @Output() tryAgain: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancel: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }
  ngOnInit() {
  }

  trySaveAgain(): void {
    this.tryAgain.emit();
  }

  cancelSave(): void {
    this.cancel.emit();
  }
}
