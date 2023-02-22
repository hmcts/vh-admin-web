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

    constructor(private fb: FormBuilder, private justiceUserService: JusticeUsersService, private logger: Logger) {
        this.form = this.fb.group<SearchForExistingJusticeUserForm>({
            inputSearch: new FormControl('')
        });
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
        const term = this.form.value.inputSearch;
        this.errorMessage = false;
        this.displayAddButton = false;
        this.displayMessage = false;
        this.message = '';
        this.isEditing = false;
        this.justiceUserService.retrieveJusticeUserAccountsNoCache(term).subscribe(
            (data: JusticeUserResponse[]) => {
                this.users = data;
                this.logger.debug(`${this.loggerPrefix} Updating list of users.`, { users: data.length });
                if (this.users.length > this.filterSize) {
                    this.users = this.users.slice(0, this.filterSize);
                    this.displayMessage = true;
                    this.message = `Only the first ${this.filterSize} results are shown, please refine your search to see more results.`;
                } else if (this.users.length === 0) {
                    this.displayAddButton = true;
                    this.displayMessage = true;
                    this.errorMessage = true;
                    this.message =
                        'No users matching this search criteria were found. ' +
                        'Please check the search and try again. Or, add the team member.';
                }
            },
            error => {
                this.handleListError(error, 'users');
            }
        );
    }

    searchForExistingUser() {
        const username = this.form.value.inputSearch;
        if (isAValidEmail(username)) {
            this.justiceUserService.checkIfUserExistsByUsername(username).subscribe({
                next: result => this.onUserAccountFound(result),
                error: (error: string | BookHearingException) => this.onUserAccountNotFound(error)
            });
            // this.justiceUserService.checkIfUserExistsByUsername(username).subscribe(
            //     user => {
            //         console.warn(user);
            //     },
            //     error => {
            //         console.warn('user does not exist' + error);
            //     }
            // );
        } else {
            // TODO: handle invalid email input
            console.warn('do something about this invalid email');
        }
    }
    onUserAccountNotFound(userNotFoundError: string | BookHearingException): void {
        const isApiException = BookHearingException.isBookHearingException(userNotFoundError);
        if (isApiException) {
            const exception = userNotFoundError as BookHearingException;
            this.message =
                exception.status === 400
                    ? 'Error: Username could not be found. Please check the username and try again. An account may need to be requested via Service Catalogue'
                    : 'There was an unexpected error. Please try again later';
        } else {
            this.message = userNotFoundError;
        }
    }

    onUserAccountFound(result: ExistingJusticeUserResponse): void {
        console.warn(result);
    }

    handleListError(err, type) {
        this.logger.error(`${this.loggerPrefix} Error getting ${type} list`, err, type);
        this.error = true;
    }
}

interface SearchForExistingJusticeUserForm {
    inputSearch: FormControl<string>;
}
