import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
    selector: 'app-remove-popup',
    templateUrl: './remove-popup.component.html',
    standalone: false
})
export class RemovePopupComponent {
    @Output() continueRemove: EventEmitter<any> = new EventEmitter<any>();

    @Output() cancelRemove: EventEmitter<any> = new EventEmitter<any>();

    @Input() fullName: string;

    constructor() {}

    continueRemoveParticipant() {
        this.continueRemove.emit();
    }

    cancelRemoveParticipant() {
        this.cancelRemove.emit();
    }
}
