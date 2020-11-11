import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-confirmation-popup',
    templateUrl: './confirmation-popup.component.html'
})
export class ConfirmationPopupComponent implements OnInit {
    @Input() message: string;
    @Output() ok: EventEmitter<any> = new EventEmitter<any>();

    constructor() {}

    ngOnInit() {}

    confirm() {
        this.ok.emit();
    }
}
