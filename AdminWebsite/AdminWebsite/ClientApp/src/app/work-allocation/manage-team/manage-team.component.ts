import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { faCircleExclamation, faExclamationCircle, faTrash, faUserPen, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { JusticeUserResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { JusticeUsersService } from '../../services/justice-users.service';
import { Constants } from 'src/app/common/constants';
import { JusticeUserFormMode } from '../justice-user-form/justice-user-form.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';

@Component({
    selector: 'app-manage-team',
    templateUrl: './manage-team.component.html',
    styleUrls: ['./manage-team.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageTeamComponent implements OnInit, OnDestroy {
    private filterSize = 20;
    loggerPrefix = '[ManageTeamComponent] -';
    faExclamation = faCircleExclamation;
    faError = faExclamationCircle;
    editUserIcon = faUserPen;
    deleteUserIcon = faTrash;
    form: FormGroup<SearchForExistingJusticeUserForm>;

    isEditing = false;
    isSaving = false;
    justiceUser: JusticeUserResponse;
    restoreUserIcon = faRotateLeft;
    selectedUser: JusticeUserResponse;
    userToDelete: JusticeUserResponse;
    displayRestoreUserPopup = false;
    userToRestore: JusticeUserResponse;

    message$ = new BehaviorSubject<string>(null);
    users$: Observable<JusticeUserResponse[]>;
    displayAddButton$ = new BehaviorSubject(false);
    isAnErrorMessage$ = new BehaviorSubject(false);
    showSpinner$ = new BehaviorSubject(false);
    displayMessage$ = new BehaviorSubject(false);
    showForm$ = new BehaviorSubject(false);
    displayDeleteUserPopup$ = new BehaviorSubject(false);
    userFormMode$ = new BehaviorSubject<JusticeUserFormMode>('add');

    destroyed$ = new Subject<void>();

    constructor(private fb: FormBuilder, private justiceUserService: JusticeUsersService, private logger: Logger) {
        this.form = this.fb.group<SearchForExistingJusticeUserForm>({
            inputSearch: new FormControl('')
        });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    ngOnInit() {
        this.form.controls.inputSearch.valueChanges.subscribe(() => this.displayAddButton$.next(false));

        this.users$ = this.justiceUserService.filteredUsers$.pipe(
            takeUntil(this.destroyed$),
            tap(users => {
                this.displayAddButton$.next(false);
                this.isAnErrorMessage$.next(false);
                this.displayMessage$.next(false);
                this.message$.next(null);
                if (users.length > this.filterSize) {
                    this.displayMessage$.next(true);
                    this.message$.next(
                        `Only the first ${this.filterSize} results are shown, please refine your search to see more results.`
                    );
                } else if (users.length === 0) {
                    this.displayAddButton$.next(true);
                    this.isAnErrorMessage$.next(true);
                    this.displayMessage$.next(true);
                    this.message$.next(Constants.ManageJusticeUsers.EmptySearchResults);
                }
            }),
            map(users => users.slice(0, this.filterSize)),
            tap(() => this.showSpinner$.next(false))
        );
    }

    searchUsers() {
        this.showSpinner$.next(true);
        this.justiceUserService.search(this.form.value.inputSearch);
        this.isEditing = false;
    }

    sortUsers(): void {
        // const deletedUsers = this.users.filter(user => user.deleted).sort(this.sortAlphanumerically);
        // const activeUsers = this.users.filter(user => !user.deleted).sort(this.sortAlphanumerically);
        // this.sortedUsers = deletedUsers.concat(activeUsers);
    }

    sortAlphanumerically(a: JusticeUserResponse, b: JusticeUserResponse) {
        return a.username.localeCompare(b.username, undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    }

    onJusticeUserSearchFailed(errorMessage: string) {
        this.logger.error(`${this.loggerPrefix} There was an unexpected error searching for justice users`, new Error(errorMessage));
        this.message$.next(Constants.Error.ManageJusticeUsers.SearchFailure);
        this.displayMessage$.next(true);
    }

    onUserFormCancelled() {
        this.showForm$.next(false);
        // reset form related properties
        this.justiceUser = null;
        this.userFormMode$.next('add');
    }

    onJusticeSuccessfulSave() {
        if (this.userFormMode$.getValue() === 'add') {
            this.showForm$.next(false);
            this.message$.next(Constants.ManageJusticeUsers.NewUserAdded);
            this.isAnErrorMessage$.next(false);
            this.displayMessage$.next(true);
        } else if (this.userFormMode$.getValue() === 'edit') {
            this.showForm$.next(false);
            this.message$.next(Constants.ManageJusticeUsers.UserEdited);
            this.isAnErrorMessage$.next(false);
            this.displayMessage$.next(true);

            // reset form related properties
            this.justiceUser = null;
            this.userFormMode$.next('add');
        }
    }

    onJusticeUserSuccessfulSave(user: JusticeUserResponse) {
        if (this.userFormMode$.getValue() === 'add') {
            this.resetAfterSave(Constants.ManageJusticeUsers.NewUserAdded);
        } else if (this.userFormMode$.getValue() === 'edit') {
            this.resetAfterSave(Constants.ManageJusticeUsers.UserEdited);
        }
        // this.sortUsers();
    }

    addUser = this.displayUserForm;

    editUser(user: JusticeUserResponse) {
        this.selectedUser = user;
        this.userFormMode$.next('edit');
        this.displayUserForm();
    }

    onDeleteJusticeUser(user: JusticeUserResponse) {
        this.userToDelete = user;
        this.displayDeleteUserPopup$.next(true);
    }

    onCancelDeleteJusticeUser() {
        this.removeJusticeUser();
        this.displayDeleteUserPopup$.next(false);
    }

    onJusticeUserSuccessfulDelete() {
        this.removeJusticeUser();
        this.displayDeleteUserPopup$.next(false);
        this.message$.next(Constants.ManageJusticeUsers.UserDeleted);
        this.displayMessage$.next(true);
    }

    removeJusticeUser() {
        this.userToDelete = null;
        // this.updateDeletedJusticeUser();
        this.sortUsers();
    }

    updateDeletedJusticeUser() {
        // this.userToDelete.deleted = true;
    }

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
        this.message$.next(Constants.ManageJusticeUsers.UserRestored);
        this.displayMessage$.next(true);
        this.updateRestoredJusticeUser();
        this.sortUsers();
    }

    updateRestoredJusticeUser() {
        this.userToRestore.deleted = false;
    }

    displayUserForm() {
        this.displayMessage$.next(false);
        this.showForm$.next(true);
    }

    private resetAfterSave(message: string) {
        this.showForm$.next(false);
        this.message$.next(message);
        this.displayAddButton$.next(false);
        this.isAnErrorMessage$.next(false);
        this.displayMessage$.next(true);
        this.selectedUser = null;
        this.userFormMode$.next('add');
    }
}

interface SearchForExistingJusticeUserForm {
    inputSearch: FormControl<string>;
}
