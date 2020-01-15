import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-update-user-popup',
  templateUrl: './update-user-popup.component.html'
})
export class UpdateUserPopupComponent implements OnInit {
  @Input() message: string;
  @Output() okay: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }
  ngOnInit() {
  }

  okayClose(): void {
    this.okay.emit();
  }
}
