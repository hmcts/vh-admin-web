import { Component, EventEmitter, Output } from '@angular/core';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-confirm-delete-popup',
    templateUrl: './confirm-delete-popup.component.html'
})
export class ConfirmDeletePopupComponent {
    private readonly loggerPrefix = '[DeleteParticipant] -';
    @Output() deletionAnswer = new EventEmitter<boolean>();

    constructor(private logger: Logger) {}

    confirmDelete() {
        this.logger.debug(`${this.loggerPrefix} Confirmed to delete participant`);
        this.deletionAnswer.emit(true);
    }

    cancelDelete() {
        this.logger.debug(`${this.loggerPrefix} Chose to not delete participant`);
        this.deletionAnswer.emit(false);
    }
}
