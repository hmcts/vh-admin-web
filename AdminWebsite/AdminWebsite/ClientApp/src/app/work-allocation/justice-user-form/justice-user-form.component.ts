import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Constants } from 'src/app/common/constants';
import { BookHearingException, JusticeUserResponse, JusticeUserRole, ValidationProblemDetails } from 'src/app/services/clients/api-client';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { toCamel } from 'ts-case-convert';
import { justiceUserRoleValidator } from '../../common/custom-validations/justice-user-role-validator';

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
            roles: value.user_roles
        });

        this.form.controls.rolevho.setValue(value.user_roles.includes(JusticeUserRole.Vho));
        this.form.controls.roleadmin.setValue(value.user_roles.includes(JusticeUserRole.VhTeamLead));
        this.form.controls.rolesm.setValue(value.user_roles.includes(JusticeUserRole.StaffMember));
    }

    @Input() mode: JusticeUserFormMode = 'add';

    @Output() saveSuccessfulEvent = new EventEmitter<JusticeUserResponse>();
    @Output() cancelFormEvent = new EventEmitter();

    constructor(private formBuilder: FormBuilder, private justiceUserService: JusticeUsersService) {
        this.form = this.formBuilder.group<JusticeUserForm>({
            username: new FormControl('', [Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)]),
            contactTelephone: new FormControl('', [Validators.pattern(Constants.PhonePattern)]),
            firstName: new FormControl('', [Validators.pattern(Constants.TextInputPatternName)]),
            lastName: new FormControl('', [Validators.pattern(Constants.TextInputPatternName)]),
            roles: new FormControl([], [justiceUserRoleValidator()]),
            rolevho: new FormControl(false),
            roleadmin: new FormControl(false),
            rolesm: new FormControl(false)
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
        const roles = this.getRoles();
        this.justiceUserService
            .addNewJusticeUser(
                this.form.controls.username.value,
                this.form.controls.firstName.value,
                this.form.controls.lastName.value,
                this.form.controls.contactTelephone.value,
                roles
            )
            .subscribe({
                next: newJusticeUser => this.onSaveSucceeded(newJusticeUser),
                error: (error: string | BookHearingException) => this.onSaveFailed(error)
            });
    }

    private updateExistingUser() {
        const roles = this.getRoles();
        this.justiceUserService.editJusticeUser(this._justiceUser.id, this.form.getRawValue().username, roles).subscribe({
            next: newJusticeUser => this.onSaveSucceeded(newJusticeUser),
            error: (error: string | BookHearingException) => this.onSaveFailed(error)
        });
    }

    private getRoles(): JusticeUserRole[] {
        const roles: JusticeUserRole[] = [];
        if (this.form.controls.rolevho.value) roles.push(JusticeUserRole.Vho);
        if (this.form.controls.roleadmin.value) roles.push(JusticeUserRole.VhTeamLead);
        if (this.form.controls.rolesm.value) roles.push(JusticeUserRole.StaffMember);

        return roles;
    }

    onCheckBoxChange() {
        const roles = this.getRoles();
        this.form.controls.roles.setValue(roles);
    }

}

interface JusticeUserForm {
    username: FormControl<string>;
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    contactTelephone: FormControl<string>;
    roles: FormControl<JusticeUserRole[]>;
    rolevho: FormControl<boolean>;
    roleadmin: FormControl<boolean>;
    rolesm: FormControl<boolean>;
}
