import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-save-failed-popup',
    templateUrl: './save-failed-popup.component.html'
})
export class SaveFailedPopupComponent implements OnInit {
    @Output() tryAgain: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancel: EventEmitter<any> = new EventEmitter<any>();

    @Input() errorMessages: string[];

    constructor() {}
    ngOnInit() {}

    trySaveAgain(): void {
        this.tryAgain.emit();
    }

    cancelSave(): void {
        this.cancel.emit();
    }
}
