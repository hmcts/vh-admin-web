import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { faCircleExclamation, faExclamationCircle, faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
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
    userFormMode: JusticeUserFormMode = 'add';
    userToDelete: JusticeUserResponse;

    message$ = new BehaviorSubject<string>(null);
    users$: Observable<JusticeUserResponse[]>;
    displayAddButton$ = new BehaviorSubject(false);
    isAnErrorMessage$ = new BehaviorSubject(false);
    showSpinner$ = new BehaviorSubject(false);
    displayMessage$ = new BehaviorSubject(false);
    showForm$ = new BehaviorSubject(false);
    displayDeleteUserPopup$ = new BehaviorSubject(false);

    destroyed$ = new Subject<void>;

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

        this.showSpinner$.next(true);

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
        this.justiceUserService.search(this.form.value.inputSearch);
        this.isEditing = false;
    }

    onJusticeUserSearchFailed(errorMessage: string) {
        this.logger.error(`${this.loggerPrefix} There was an unexpected error searching for justice users`, new Error(errorMessage));
        this.message$.next(Constants.Error.ManageJusticeUsers.SearchFailure);
        this.displayMessage$.next(true);
    }

    displayForm() {
        this.displayMessage$.next(false);
        this.showForm$.next(true);
    }

    onFormCancelled() {
        this.showForm$.next(false);
        // reset form related properties
        this.justiceUser = null;
        this.userFormMode = 'add';
    }

    onJusticeSuccessfulSave() {
        if (this.userFormMode === 'add') {
            this.showForm$.next(false);
            this.message$.next(Constants.ManageJusticeUsers.NewUserAdded);
            this.isAnErrorMessage$.next(false);
            this.displayMessage$.next(true);
        } else if (this.userFormMode === 'edit') {
            this.showForm$.next(false);
            this.message$.next(Constants.ManageJusticeUsers.UserEdited);
            this.isAnErrorMessage$.next(false);
            this.displayMessage$.next(true);

            // reset form related properties
            this.justiceUser = null;
            this.userFormMode = 'add';
        }
    }

    editUser(user: JusticeUserResponse) {
        this.justiceUser = user;
        this.userFormMode = 'edit';
        this.displayForm();
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
    }
}

interface SearchForExistingJusticeUserForm {
    inputSearch: FormControl<string>;
}
