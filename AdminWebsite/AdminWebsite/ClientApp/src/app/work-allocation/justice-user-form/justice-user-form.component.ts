import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import {
    BookHearingException,
    ExistingJusticeUserResponse,
    JusticeUserRole,
    ValidationProblemDetails
} from 'src/app/services/clients/api-client';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { toCamel } from 'ts-case-convert';

@Component({
    selector: 'app-justice-user-form',
    templateUrl: './justice-user-form.component.html'
})
export class JusticeUserFormComponent {
    errorIcon = faExclamationCircle;
    showSpinner = false;
    failedSaveMessage: string;
    availableRoles = JusticeUserRole;
    form: FormGroup<JusticeUserForm>;

    _justiceUser: ExistingJusticeUserResponse;

    @Input()
    set justiceUser(value: ExistingJusticeUserResponse) {
        if (!value) return;
        this._justiceUser = value;
        this.form.reset({
            firstName: value.first_name,
            lastName: value.last_name,
            username: value.username,
            contactEmail: value.contact_email,
            role: this.availableRoles.Vho
        });
    }

    @Output() saveSuccessfulEvent = new EventEmitter<ExistingJusticeUserResponse>();
    @Output() saveFailedEvent = new EventEmitter<string>();
    @Output() cancelFormEvent = new EventEmitter();

    constructor(private formBuilder: FormBuilder, private justiceUserService: JusticeUsersService) {
        this.form = this.formBuilder.group<JusticeUserForm>({
            username: new FormControl({ value: null, disabled: true }),
            contactEmail: new FormControl({ value: null, disabled: true }),
            firstName: new FormControl({ value: null, disabled: true }),
            lastName: new FormControl({ value: null, disabled: true }),
            role: new FormControl(null)
        });
    }

    onSave() {
        this.failedSaveMessage = null;
        this.showSpinner = true;
        this.justiceUserService
            .addNewJusticeUser(
                this.form.getRawValue().username,
                this.form.getRawValue().firstName,
                this.form.getRawValue().lastName,
                this.form.getRawValue().contactEmail,
                this._justiceUser.telephone,
                this.form.value.role
            )
            .subscribe({
                next: newJusticeUser => this.onSaveSucceeded(newJusticeUser),
                error: (error: string | BookHearingException) => this.onSaveFailed(error)
            });
    }

    onCancel() {
        this.cancelFormEvent.emit();
    }

    onSaveSucceeded(newJusticeUser: ExistingJusticeUserResponse): void {
        this.showSpinner = false;
        this.saveSuccessfulEvent.emit(newJusticeUser);
    }

    onSaveFailed(onSaveFailedError: string | BookHearingException | ValidationProblemDetails): void {
        this.showSpinner = false;
        let message = 'There was an unexpected error. Please try again later.';
        if (BookHearingException.isBookHearingException(onSaveFailedError)) {
            const exception = onSaveFailedError as BookHearingException;
            if (exception.status === 409) {
                message = 'A justice user with the same name already exists';
            }
        }

        if (onSaveFailedError instanceof ValidationProblemDetails) {
            const validationProblems = onSaveFailedError.errors;
            for (const propertyName in validationProblems) {
                const validationMessage = validationProblems[propertyName][0];
                const controlName = toCamel(propertyName);
                this.form.get(controlName)?.setErrors({ errorMessage: validationMessage });
            }
            message = 'Please ensure all values provided are valid';
        }
        this.failedSaveMessage = message;
    }
}

interface JusticeUserForm {
    username: FormControl<string>;
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    contactEmail: FormControl<string>;
    role: FormControl<JusticeUserRole>;
}
