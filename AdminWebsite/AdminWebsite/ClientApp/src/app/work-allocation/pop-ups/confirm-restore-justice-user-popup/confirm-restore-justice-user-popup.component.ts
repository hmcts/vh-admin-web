import { Component, EventEmitter, Input, Output } from '@angular/core';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Constants } from 'src/app/common/constants';
import { JusticeUserResponse } from 'src/app/services/clients/api-client';
import { JusticeUsersService } from 'src/app/services/justice-users.service';

@Component({
    selector: 'app-confirm-restore-justice-user-popup',
    templateUrl: './confirm-restore-justice-user-popup.component.html'
})
export class ConfirmRestoreJusticeUserPopupComponent {
    errorIcon = faExclamationCircle;
    isRestoring = false;
    failedRestoreMessage: string;

    @Output() cancelEvent = new EventEmitter();
    @Output() restoreSuccessfulEvent = new EventEmitter();

    @Input() user: JusticeUserResponse;

    constructor(private justiceUserService: JusticeUsersService) {}

    onConfirmRestore() {
        this.failedRestoreMessage = null;
        this.isRestoring = true;
        this.justiceUserService.restoreJusticeUser(this.user.id, this.user.username).subscribe({
            next: () => this.onRestoreSucceeded(),
            error: () => this.onRestoreFailed()
        });
    }

    onCancel() {
        this.cancelEvent.emit();
    }

    onRestoreSucceeded() {
        this.isRestoring = false;
        this.restoreSuccessfulEvent.emit();
    }

    onRestoreFailed() {
        this.isRestoring = false;
        this.failedRestoreMessage = Constants.Error.RestoreJusticeUser.RestoreFailure;
    }
}
