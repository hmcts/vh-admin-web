import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-save-failed-popup',
    templateUrl: './save-failed-popup.component.html'
})
export class SaveFailedPopupComponent {
    @Output() tryAgain: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancel: EventEmitter<any> = new EventEmitter<any>();

    @Input() errorMessages: string[];

    trySaveAgain(): void {
        this.tryAgain.emit();
    }

    cancelSave(): void {
        this.cancel.emit();
    }
}
