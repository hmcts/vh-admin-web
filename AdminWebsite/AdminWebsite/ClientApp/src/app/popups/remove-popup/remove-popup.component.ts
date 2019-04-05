import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';

@Component({
  selector: 'app-remove-popup',
  templateUrl: './remove-popup.component.html',
})
export class RemovePopupComponent implements OnInit {

  @Output() continueRemove: EventEmitter<any> = new EventEmitter<any>();

  @Output() cancelRemove: EventEmitter<any> = new EventEmitter<any>();

  @Input() fullName: string;

  @Input()
  isLastParticipant: boolean;


  constructor() { }

  ngOnInit() {
  }

  continueRemoveParticipant() {
    this.continueRemove.emit();
  }

  cancelRemoveParticipant() {
    this.cancelRemove.emit();
  }
}
