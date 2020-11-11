import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ClipboardService } from 'ngx-clipboard';
import { Subscription } from 'rxjs';
import { UpdateUserPasswordResponse } from '../services/clients/api-client';
import { Logger } from '../services/logger';
import { UserDataService } from '../services/user-data.service';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[ChangePassword] -';
    form: FormGroup;
    failedSubmission: boolean;
    isValidEmail: boolean;
    showUpdateSuccess: boolean;
    showCopyPasswordButton: boolean;
    password: string;
    popupMessage: string;
    saveSuccess: boolean;
    $subcription: Subscription;

    constructor(
        private fb: FormBuilder,
        private userDataService: UserDataService,
        private clipboardService: ClipboardService,
        private logger: Logger
    ) {
        this.showUpdateSuccess = false;
        this.isValidEmail = true;
        this.showCopyPasswordButton = false;
    }

    ngOnInit() {
        this.logger.debug(`${this.loggerPrefix} Resetting form`);
        this.saveSuccess = false;
        this.failedSubmission = false;
        this.form = this.fb.group({
            userName: ['']
        });
    }

    get userName() {
        return this.form.get('userName');
    }

    get userNameInvalid() {
        return this.userName.invalid && (this.userName.dirty || this.userName.touched || this.failedSubmission);
    }

    userNameOnBlur() {
        const userNameText = this.userName.value;
        /* tslint:disable: max-line-length */
        const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        this.isValidEmail =
            userNameText && userNameText.length > 0 && userNameText.length < 256 && pattern.test(userNameText.toLowerCase());
        this.logger.debug(`${this.loggerPrefix} Validated username.`, { username: userNameText, isValid: this.isValidEmail });
    }

    updateUser() {
        if (this.form.valid) {
            this.failedSubmission = false;
            this.saveSuccess = false;

            this.logger.debug(`${this.loggerPrefix} Attempting to reset password for user.`, { username: this.userName.value });
            this.$subcription = this.userDataService.updateUser(this.userName.value).subscribe(
                (data: UpdateUserPasswordResponse) => {
                    // tslint:disable-next-line: quotemark
                    this.popupMessage = "User's password has been changed";
                    this.showUpdateSuccess = true;
                    this.password = data.password;
                    this.showCopyPasswordButton = true;
                    this.logger.info(`${this.loggerPrefix} User password has been reset.`, { username: this.userName.value });
                    this.saveSuccess = true;
                },
                error => {
                    this.popupMessage = 'User does not exist - please try again';
                    this.showUpdateSuccess = true;
                    this.showCopyPasswordButton = false;
                    this.logger.error(`${this.loggerPrefix} User does not exist.`, error, { username: this.userName.value });
                }
            );
        } else {
            this.failedSubmission = true;
        }
    }

    copyPassword() {
        this.clipboardService.copyFromContent(this.password);
        this.logger.debug(`${this.loggerPrefix} Copied new password to clipboard.`, { username: this.userName.value });
    }

    okay(): void {
        this.logger.debug(`${this.loggerPrefix} Closing popup.`, { username: this.userName.value });
        this.showUpdateSuccess = false;
    }

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).focus();
    }

    ngOnDestroy() {
        this.logger.debug(`${this.loggerPrefix} Leaving change password.`);
        if (this.$subcription) {
            this.$subcription.unsubscribe();
        }
    }
}
