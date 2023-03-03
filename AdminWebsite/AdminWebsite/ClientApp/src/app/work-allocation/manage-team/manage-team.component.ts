import { Component } from '@angular/core';
import { faCircleExclamation, faExclamationCircle, faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { JusticeUserResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { JusticeUsersService } from '../../services/justice-users.service';
import { Constants } from 'src/app/common/constants';

@Component({
    selector: 'app-manage-team',
    templateUrl: './manage-team.component.html',
    styleUrls: ['./manage-team.component.scss']
})
export class ManageTeamComponent {
    private filterSize = 20;
    loggerPrefix = '[ManageTeamComponent] -';
    displayMessage = false;
    faExclamation = faCircleExclamation;
    faError = faExclamationCircle;
    editUserIcon = faUserPen;
    deleteUserIcon = faTrash;
    message: string;
    users: JusticeUserResponse[];
    form: FormGroup<SearchForExistingJusticeUserForm>;
    isEditing = false;
    isSaving = false;
    displayAddButton = false;
    isAnErrorMessage = false;
    showSpinner = false;
    showForm = false;
    displayDeleteUserPopup = false;
    userToDelete: JusticeUserResponse;

    constructor(private fb: FormBuilder, private justiceUserService: JusticeUsersService, private logger: Logger) {
        this.form = this.fb.group<SearchForExistingJusticeUserForm>({
            inputSearch: new FormControl('')
        });
        this.form.controls.inputSearch.valueChanges.subscribe(() => (this.displayAddButton = false));
    }

    searchUsers() {
        this.isAnErrorMessage = false;
        this.displayAddButton = false;
        this.displayMessage = false;
        this.message = '';
        this.isEditing = false;
        this.showSpinner = true;
        this.justiceUserService.retrieveJusticeUserAccountsNoCache(this.form.value.inputSearch).subscribe({
            next: (data: JusticeUserResponse[]) => this.onJusticeUserSearchComplete(data),
            error: error => this.onJusticeUserSearchFailed(error),
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
            this.isAnErrorMessage = true;
            this.message = Constants.ManageJusticeUsers.EmptySearchResults;
            this.displayAddButton = true;
        }
    }

    onJusticeUserSearchFailed(errorMessage: string) {
        this.logger.error(`${this.loggerPrefix} There was an unexpected error searching for justice users`, new Error(errorMessage));
        this.message = Constants.Error.ManageJusticeUsers.SearchFailure;
        this.displayMessage = true;
    }

    displayForm() {
        this.displayMessage = false;
        this.showForm = true;
    }

    onFormCancelled() {
        this.showForm = false;
    }

    onJusticeSuccessfulSave(newUser: JusticeUserResponse) {
        this.showForm = false;
        this.displayAddButton = false;
        this.message = Constants.ManageJusticeUsers.NewUserAdded;
        this.isAnErrorMessage = false;
        this.displayMessage = true;
        this.users.push(newUser);
    }

    onDeleteJusticeUser(user: JusticeUserResponse) {
        this.userToDelete = user;
        this.displayDeleteUserPopup = true;
    }

    onCancelDeleteJusticeUser() {
        this.userToDelete = null;
        this.displayDeleteUserPopup = false;
    }

    onJusticeUserSuccessfulDelete() {
        this.displayDeleteUserPopup = false;
        this.message = Constants.ManageJusticeUsers.UserDeleted;
        this.displayMessage = true;
        this.removeJusticeUser();
    }

    removeJusticeUser() {
        const id = this.users.indexOf(this.userToDelete);
        this.users.splice(id, 1);
        this.userToDelete = null;
    }
}

interface SearchForExistingJusticeUserForm {
    inputSearch: FormControl<string>;
}
