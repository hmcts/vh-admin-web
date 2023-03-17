import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Constants } from 'src/app/common/constants';
import { BookHearingException, JusticeUserResponse, JusticeUserRole, ValidationProblemDetails } from 'src/app/services/clients/api-client';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { toCamel } from 'ts-case-convert';

export type JusticeUserFormMode = 'add' | 'edit';

@Component({
    selector: 'app-justice-user-form',
    templateUrl: './justice-user-form.component.html'
})
export class JusticeUserFormComponent implements OnChanges {
    errorMessages = Constants.Error;
    errorIcon = faExclamationCircle;
    showSpinner = false;
    failedSaveMessage: string;
    availableRoles = JusticeUserRole;
    form: FormGroup<JusticeUserForm>;

    _justiceUser: JusticeUserResponse;

    @Input()
    set justiceUser(value: JusticeUserResponse) {
        if (!value) {
            return;
        }
        this._justiceUser = value;
        this.form.reset({
            firstName: value.first_name,
            lastName: value.lastname,
            username: value.username,
            contactTelephone: value.telephone,
            role: this.availableRoles.Vho
        });

        this.form.get('role').setValue(value.is_vh_team_leader ? this.availableRoles.VhTeamLead : this.availableRoles.Vho);
    }

    @Input() mode: JusticeUserFormMode = 'add';

    @Output() saveSuccessfulEvent = new EventEmitter<JusticeUserResponse>();
    @Output() cancelFormEvent = new EventEmitter();

    constructor(private formBuilder: FormBuilder, private justiceUserService: JusticeUsersService) {
        this.form = this.formBuilder.group<JusticeUserForm>({
            username: new FormControl('', [Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)]),
            contactTelephone: new FormControl(''),
            firstName: new FormControl('', [Validators.pattern(Constants.TextInputPatternName)]),
            lastName: new FormControl('', [Validators.pattern(Constants.TextInputPatternName)]),
            role: new FormControl(this.availableRoles.Vho)
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        const mode = changes['mode'];
        if (mode.currentValue === 'edit') {
            ['firstName', 'lastName', 'username', 'contactTelephone'].forEach(field => this.form.controls[field].disable());
        }
    }

    onSave() {
        this.failedSaveMessage = null;
        this.showSpinner = true;
        if (this.mode === 'add') {
            this.addNewUser();
        } else if (this.mode === 'edit') {
            this.updateExistingUser();
        }
    }

    onCancel() {
        this.cancelFormEvent.emit();
    }

    onSaveSucceeded(newJusticeUser: JusticeUserResponse): void {
        this.showSpinner = false;
        this.saveSuccessfulEvent.emit(newJusticeUser);
    }

    onSaveFailed(onSaveFailedError: string | BookHearingException | ValidationProblemDetails): void {
        this.showSpinner = false;
        let message = Constants.Error.JusticeUserForm.SaveError;
        if (BookHearingException.isBookHearingException(onSaveFailedError)) {
            debugger;
            if (onSaveFailedError.status === 409) {
                message = Constants.Error.JusticeUserForm.SaveErrorDuplicateUser;
            }
            if (onSaveFailedError.status === 400 && onSaveFailedError.result instanceof ValidationProblemDetails) {
                const validationProblems = onSaveFailedError.result.errors;
                Object.keys(validationProblems).forEach(propertyName => {
                    const validationMessage = validationProblems[propertyName][0];
                    const controlName = toCamel(propertyName);
                    this.form.get(controlName)?.setErrors({ errorMessage: validationMessage });
                });
                message = onSaveFailedError.result.title;
            }
        }
        this.failedSaveMessage = message;
    }

    private addNewUser() {
        this.justiceUserService
            .addNewJusticeUser(
                this.form.controls.username.value,
                this.form.controls.firstName.value,
                this.form.controls.lastName.value,
                this.form.controls.contactTelephone.value,
                this.form.value.role
            )
            .subscribe({
                next: newJusticeUser => this.onSaveSucceeded(newJusticeUser),
                error: (error: string | BookHearingException) => this.onSaveFailed(error)
            });
    }

    private updateExistingUser() {
        this.justiceUserService.editJusticeUser(this._justiceUser.id, this.form.getRawValue().username, this.form.value.role).subscribe({
            next: newJusticeUser => this.onSaveSucceeded(newJusticeUser),
            error: (error: string | BookHearingException) => this.onSaveFailed(error)
        });
    }
}

interface JusticeUserForm {
    username: FormControl<string>;
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    contactTelephone: FormControl<string>;
    role: FormControl<JusticeUserRole>;
}
