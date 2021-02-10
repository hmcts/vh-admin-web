import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-remove-interpreter-popup',
    templateUrl: './remove-interpreter-popup.component.html'
})
export class RemoveInterpreterPopupComponent  {
    @Output() continueRemove: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancelRemove: EventEmitter<any> = new EventEmitter<any>();

    @Input()
    isLastParticipant: boolean;

    continueRemoveInterpreter() {
        this.continueRemove.emit();
    }

    cancelRemoveInterpreter() {
        this.cancelRemove.emit();
    }
}
