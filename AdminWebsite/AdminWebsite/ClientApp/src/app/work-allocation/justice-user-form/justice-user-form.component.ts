import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Constants } from 'src/app/common/constants';
import { BookHearingException, JusticeUserResponse, JusticeUserRole, ValidationProblemDetails } from 'src/app/services/clients/api-client';
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
            telephone: value.telephone,
            role: this.availableRoles.Vho
        });
    }

    @Output() saveSuccessfulEvent = new EventEmitter<JusticeUserResponse>();
    @Output() cancelFormEvent = new EventEmitter();

    constructor(private formBuilder: FormBuilder, private justiceUserService: JusticeUsersService) {
        this.form = this.formBuilder.group<JusticeUserForm>({
            username: new FormControl('', [Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)]),
            telephone: new FormControl('', [Validators.pattern(Constants.PhonePattern)]),
            firstName: new FormControl('', [Validators.pattern(Constants.TextInputPatternName)]),
            lastName: new FormControl('', [Validators.pattern(Constants.TextInputPatternName)]),
            role: new FormControl(this.availableRoles.Vho)
        });
    }

    onSave() {
        this.failedSaveMessage = null;
        this.showSpinner = true;
        this.justiceUserService
            .addNewJusticeUser(
                this.form.controls.username.value,
                this.form.controls.firstName.value,
                this.form.controls.lastName.value,
                this.form.controls.telephone.value,
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

    onSaveSucceeded(newJusticeUser: JusticeUserResponse): void {
        this.showSpinner = false;
        this.saveSuccessfulEvent.emit(newJusticeUser);
    }

    onSaveFailed(onSaveFailedError: string | BookHearingException | ValidationProblemDetails): void {
        this.showSpinner = false;
        let message = Constants.Error.JusticeUserForm.SaveError;
        if (BookHearingException.isBookHearingException(onSaveFailedError)) {
            if (onSaveFailedError.status === 409) {
                message = Constants.Error.JusticeUserForm.SaveErrorDuplicateUser;
            }
        }

        if (onSaveFailedError instanceof ValidationProblemDetails) {
            const validationProblems = onSaveFailedError.errors;
            Object.keys(validationProblems).forEach(propertyName => {
                const validationMessage = validationProblems[propertyName][0];
                const controlName = toCamel(propertyName);
                this.form.get(controlName)?.setErrors({ errorMessage: validationMessage });
            });
            message = onSaveFailedError.title;
        }
        this.failedSaveMessage = message;
    }
}

interface JusticeUserForm {
    username: FormControl<string>;
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    telephone: FormControl<string>;
    role: FormControl<JusticeUserRole>;
}
