import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-remove-interpreter-popup',
    templateUrl: './remove-interpreter-popup.component.html',
    standalone: false
})
export class RemoveInterpreterPopupComponent {
    @Output() continueRemove: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancelRemove: EventEmitter<any> = new EventEmitter<any>();

    continueRemoveInterpreter() {
        this.continueRemove.emit();
    }

    cancelRemoveInterpreter() {
        this.cancelRemove.emit();
    }
}
