import { Component, EventEmitter, Input, Output } from '@angular/core';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Constants } from 'src/app/common/constants';
import { JusticeUsersService } from 'src/app/services/justice-users.service';

@Component({
    selector: 'app-confirm-delete-justice-user-popup',
    templateUrl: './confirm-delete-justice-user-popup.component.html'
})
export class ConfirmDeleteJusticeUserPopupComponent {
    errorIcon = faExclamationCircle;
    showSpinner = false;
    failedDeleteMessage: string;

    @Output() cancelEvent = new EventEmitter();
    @Output() deleteSuccessfulEvent = new EventEmitter();

    @Input() userId: string;
    @Input() username: string;

    constructor(private justiceUserService: JusticeUsersService) {}

    onConfirmDelete() {
        this.failedDeleteMessage = null;
        this.showSpinner = true;
        this.justiceUserService.deleteJusticeUser(this.userId).subscribe({
            next: () => this.onDeleteSucceeded(),
            error: () => this.onDeleteFailed()
        });
    }

    onCancel() {
        this.cancelEvent.emit();
    }

    onDeleteSucceeded() {
        this.showSpinner = false;
        this.deleteSuccessfulEvent.emit();
    }

    onDeleteFailed() {
        this.showSpinner = false;
        this.failedDeleteMessage = Constants.Error.DeleteJusticeUser.DeleteFailure;
    }
}
