import { Component } from '@angular/core';
import { faCircleExclamation, faExclamationCircle, faTrash, faUserPen, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { JusticeUserResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { JusticeUsersService } from '../../services/justice-users.service';
import { Constants } from 'src/app/common/constants';
import { JusticeUserFormMode } from '../justice-user-form/justice-user-form.component';

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
    restoreUserIcon = faRotateLeft;
    message: string;
    users: JusticeUserResponse[];
    sortedUsers: JusticeUserResponse[] = [];
    form: FormGroup<SearchForExistingJusticeUserForm>;
    isEditing = false;
    isSaving = false;
    displayAddButton = false;
    isAnErrorMessage = false;
    showSpinner = false;
    showUserForm = false;
    selectedUser: JusticeUserResponse;
    userFormMode: JusticeUserFormMode = 'add';
    displayDeleteUserPopup = false;
    userToDelete: JusticeUserResponse;
    displayRestoreUserPopup = false;
    userToRestore: JusticeUserResponse;

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
        this.sortUsers();
    }

    sortUsers(): void {
        const deletedUsers = this.users.filter(user => user.deleted).sort(this.sortAlphanumerically);
        const activeUsers = this.users.filter(user => !user.deleted).sort(this.sortAlphanumerically);
        this.sortedUsers = deletedUsers.concat(activeUsers);
    }

    sortAlphanumerically(a: JusticeUserResponse, b: JusticeUserResponse) {
        return a.username.localeCompare(b.username, undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    }

    onJusticeUserSearchFailed(errorMessage: string) {
        this.logger.error(`${this.loggerPrefix} There was an unexpected error searching for justice users`, new Error(errorMessage));
        this.message = Constants.Error.ManageJusticeUsers.SearchFailure;
        this.displayMessage = true;
    }

    /*
        Add & Edit User
    */

    addUser = this.displayUserForm;

    editUser(user: JusticeUserResponse) {
        this.selectedUser = user;
        this.userFormMode = 'edit';
        this.displayUserForm();
    }

    onUserFormCancelled() {
        this.showUserForm = false;
        this.selectedUser = null;
        this.userFormMode = 'add';
    }

    onJusticeUserSuccessfulSave(user: JusticeUserResponse) {
        if (this.userFormMode === 'add') {
            this.resetAfterSave(Constants.ManageJusticeUsers.NewUserAdded);
            this.users.push(user);
        } else if (this.userFormMode === 'edit') {
            const index = this.users.findIndex(x => x.id === user.id);
            this.users[index] = user;
            this.resetAfterSave(Constants.ManageJusticeUsers.UserEdited);
        }
        this.sortUsers();
    }

    /*
        End Add & Edit User
    */

    /*
        Delete User
    */

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
        this.updateDeletedJusticeUser();
        this.sortUsers();
    }

    updateDeletedJusticeUser() {
        this.userToDelete.deleted = true;
    }

    /*
        End Delete User
    */

    /*
        Restore User
    */

    restoreUser(user: JusticeUserResponse) {
        this.userToRestore = user;
        this.displayRestoreUserPopup = true;
    }

    onCancelRestoreJusticeUser() {
        this.userToRestore = null;
        this.displayRestoreUserPopup = false;
    }

    onJusticeUserSuccessfulRestore() {
        this.displayRestoreUserPopup = false;
        this.message = Constants.ManageJusticeUsers.UserRestored;
        this.displayMessage = true;
        this.updateRestoredJusticeUser();
        this.sortUsers();
    }

    updateRestoredJusticeUser() {
        this.userToRestore.deleted = false;
    }

    /*
        End Restore User
    */

    displayUserForm() {
        this.displayMessage = false;
        this.showUserForm = true;
    }

    private resetAfterSave(message: string) {
        this.showUserForm = false;
        this.displayAddButton = false;
        this.message = message;
        this.isAnErrorMessage = false;
        this.displayMessage = true;
        this.selectedUser = null;
        this.userFormMode = 'add';
    }
}

interface SearchForExistingJusticeUserForm {
    inputSearch: FormControl<string>;
}
