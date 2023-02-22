import { Component } from '@angular/core';
import { faCircleExclamation, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ExistingJusticeUserResponse, JusticeUserResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { JusticeUsersService } from '../../services/justice-users.service';
import { isAValidEmail } from 'src/app/common/custom-validations/email-validator';
import { BookHearingException } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-manage-team',
    templateUrl: './manage-team.component.html',
    styleUrls: ['./manage-team.component.scss']
})
export class ManageTeamComponent {
    private filterSize = 20;
    existingAccount: ExistingJusticeUserResponse;
    showSpinner = false;

    constructor(private fb: FormBuilder, private justiceUserService: JusticeUsersService, private logger: Logger) {
        this.form = this.fb.group<SearchForExistingJusticeUserForm>({
            inputSearch: new FormControl('')
        });
        this.form.controls.inputSearch.valueChanges.subscribe(() => (this.displayAddButton = false));
    }

    loggerPrefix = '[ManageTeamComponent] -';
    displayMessage = false;
    faExclamation = faCircleExclamation;
    faError = faExclamationCircle;
    message: string;
    users: JusticeUserResponse[];
    form: FormGroup<SearchForExistingJusticeUserForm>;
    isEditing = false;
    isSaving = false;
    error = false;
    displayAddButton = false;
    errorMessage = false;

    searchUsers() {
        this.errorMessage = false;
        this.displayAddButton = false;
        this.displayMessage = false;
        this.message = '';
        this.isEditing = false;
        this.showSpinner = true;
        this.justiceUserService.retrieveJusticeUserAccountsNoCache(this.form.value.inputSearch).subscribe({
            next: (data: JusticeUserResponse[]) => this.onJusticeUserSearchComplete(data),
            error: error => this.handleListError(error, 'users'),
            complete: () => (this.showSpinner = false)
        });
    }

    onJusticeUserSearchComplete(data: JusticeUserResponse[]) {
        this.users = data;
        this.logger.debug(`${this.loggerPrefix} Updating list of users.`, { users: data.length });
        if (this.users.length > this.filterSize) {
            this.users = this.users.slice(0, this.filterSize);
            this.displayMessage = true;
            this.message = `Only the first ${this.filterSize} results are shown, please refine your search to see more results.`;
        } else if (this.users.length === 0) {
            this.displayMessage = true;
            this.errorMessage = true;
            this.message =
                'No users matching this search criteria were found. ' + 'Please check the search and try again. Or, add the team member.';

            if (isAValidEmail(this.form.value.inputSearch)) {
                this.displayAddButton = true;
            }
        }
    }

    searchForExistingAccount() {
        this.displayMessage = false;
        const username = this.form.value.inputSearch;
        if (isAValidEmail(username)) {
            this.showSpinner = true;
            this.justiceUserService.checkIfUserExistsByUsername(username).subscribe({
                next: result => this.onUserAccountFound(result),
                error: (error: string | BookHearingException) => this.onUserAccountNotFound(error),
                complete: () => (this.showSpinner = false)
            });
        } else {
            // TODO: handle invalid email input
            console.warn('do something about this invalid email');
        }
    }

    onUserAccountNotFound(userNotFoundError: string | BookHearingException): void {
        this.showSpinner = false;
        const isApiException = BookHearingException.isBookHearingException(userNotFoundError);
        if (isApiException) {
            const exception = userNotFoundError as BookHearingException;
            this.message =
                exception.status === 400
                    ? 'Error: Username could not be found. Please check the username and try again. An account may need to be requested via Service Catalogue.'
                    : 'There was an unexpected error. Please try again later.';
        } else {
            this.message = userNotFoundError;
        }
        this.displayMessage = true;
    }

    onUserAccountFound(result: ExistingJusticeUserResponse): void {
        this.existingAccount = result;
    }

    handleListError(err, type) {
        this.logger.error(`${this.loggerPrefix} Error getting ${type} list`, err, type);
        this.error = true;
    }

    onFormCancelled() {
        this.existingAccount = null;
    }

    onJusticeSuccessfulSave(newUser: JusticeUserResponse) {
        this.existingAccount = null;
        this.displayAddButton = false;
        this.message = 'Changes saved successfully. You can now add working hours and non-availability hours for this user.';
        this.errorMessage = false;
        this.displayMessage = true;
        this.users.push(newUser);
    }

    onJusticeFailedSave(errorMessage: string) {
        this.message = errorMessage;
        this.errorMessage = false;
        this.displayMessage = true;
    }
}

interface SearchForExistingJusticeUserForm {
    inputSearch: FormControl<string>;
}
