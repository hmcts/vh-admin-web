import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-confirmation-popup',
    templateUrl: './confirmation-popup.component.html',
    standalone: false
})
export class ConfirmationPopupComponent {
    @Input() message: string;
    @Output() ok: EventEmitter<any> = new EventEmitter<any>();

    constructor() {}

    confirm() {
        this.ok.emit();
    }
}
