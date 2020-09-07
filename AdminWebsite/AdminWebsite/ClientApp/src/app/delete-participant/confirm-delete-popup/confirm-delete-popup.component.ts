import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-confirm-delete-popup',
    templateUrl: './confirm-delete-popup.component.html'
})
export class ConfirmDeletePopupComponent {
    @Output() deletionAnswer = new EventEmitter<boolean>();

    confirmDelete() {
        this.deletionAnswer.emit(true);
    }

    cancelDelete() {
        this.deletionAnswer.emit(false);
    }
}
