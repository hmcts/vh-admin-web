import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { NEVER, catchError } from 'rxjs';
import { Constants, AvailableRoles, AvailableRolesNonDom1 } from 'src/app/common/constants';
import { BookHearingException, JusticeUserResponse, JusticeUserRole, ValidationProblemDetails } from 'src/app/services/clients/api-client';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { toCamel } from 'ts-case-convert';
import { justiceUserRoleValidator } from '../../common/custom-validations/justice-user-role-validator';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

export type JusticeUserFormMode = 'add' | 'edit';

@Component({
    selector: 'app-justice-user-form',
    templateUrl: './justice-user-form.component.html'
})
export class JusticeUserFormComponent implements OnChanges {
    errorMessages = Constants.Error;
    errorIcon = faExclamationCircle;
    isSaving = false;
    failedSaveMessage: string;
    availableRoles = AvailableRolesNonDom1; // default to non-dom1 roles until go live
    form: FormGroup<JusticeUserForm>;

    _justiceUser: JusticeUserResponse;

    @Input()
    set justiceUser(value: JusticeUserResponse) {
        if (!value) {
            const defaultRoles = this.availableRoles.map(x => {
                if (x.value === JusticeUserRole.Vho) {
                    return true;
                } else {
                    return false;
                }
            });
            this.form.reset({
                firstName: '',
                lastName: '',
                username: '',
                contactTelephone: '',
                roles: defaultRoles
            });
            return;
        }
        this._justiceUser = value;
        this.populateForm(value);
    }

    @Input() mode: JusticeUserFormMode = 'add';

    @Output() saveSuccessfulEvent = new EventEmitter<JusticeUserResponse>();
    @Output() cancelFormEvent = new EventEmitter();

    constructor(
        private formBuilder: FormBuilder,
        private justiceUserService: JusticeUsersService,
        private cdRef: ChangeDetectorRef,
        private ldService: LaunchDarklyService
    ) {
        this.createForm(false);
        this.ldService.getFlag<boolean>(FeatureFlags.dom1Integration).subscribe(dom1Enabled => {
            this.createForm(dom1Enabled);
            this.populateForm(this._justiceUser); // repopulate form with new role options available
        });
    }

    createForm(dom1Enabled: boolean) {
        this.availableRoles = dom1Enabled ? AvailableRoles : AvailableRolesNonDom1;
        this.form = this.formBuilder.group<JusticeUserForm>({
            username: new FormControl('', [Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)]),
            contactTelephone: new FormControl('', [Validators.pattern(Constants.PhonePattern)]),
            firstName: new FormControl('', [Validators.pattern(Constants.TextInputPatternName)]),
            lastName: new FormControl('', [Validators.pattern(Constants.TextInputPatternName)]),
            roles: new FormArray(
                this.availableRoles.map(x => {
                    if (x.value === JusticeUserRole.Vho) {
                        return new FormControl(true);
                    } else {
                        return new FormControl(false);
                    }
                }),
                justiceUserRoleValidator(this.availableRoles)
            )
        });
        this.cdRef.markForCheck();
    }

    ngOnChanges(changes: SimpleChanges): void {
        const mode = changes['mode'];
        if (mode.currentValue === 'edit') {
            ['username'].forEach(field => this.form.controls[field].disable());
        }
    }

    onSave() {
        this.failedSaveMessage = null;
        this.isSaving = true;
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
        this.isSaving = false;
        this.saveSuccessfulEvent.emit(newJusticeUser);
    }

    onSaveFailed(onSaveFailedError: string | BookHearingException | ValidationProblemDetails): void {
        this.isSaving = false;
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

    populateForm(justiceUser: JusticeUserResponse) {
        if (!justiceUser) {
            return;
        }
        this.form.reset({
            firstName: justiceUser.first_name,
            lastName: justiceUser.lastname,
            username: justiceUser.username,
            contactTelephone: justiceUser.telephone
        });

        const roleControls = this.availableRoles.map(x => justiceUser.user_roles.includes(x.value));
        this.form.controls.roles.setValue(roleControls);
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
            .pipe(
                catchError((error: string | BookHearingException) => {
                    this.onSaveFailed(error);
                    this.cdRef.markForCheck();
                    return NEVER;
                })
            )
            .subscribe((newJusticeUser: JusticeUserResponse) => this.onSaveSucceeded(newJusticeUser));
    }

    private updateExistingUser() {
        const roles = this.getRoles();
        this.justiceUserService
            .editJusticeUser(
                this._justiceUser.id,
                this.form.getRawValue().username,
                this.form.getRawValue().firstName,
                this.form.getRawValue().lastName,
                this.form.getRawValue().contactTelephone,
                roles
            )
            .subscribe({
                next: newJusticeUser => this.onSaveSucceeded(newJusticeUser),
                error: (error: string | BookHearingException) => this.onSaveFailed(error)
            });
    }

    private getRoles(): JusticeUserRole[] {
        return this.form.value.roles.map((checked, i) => (checked ? this.availableRoles[i].value : null)).filter(v => v !== null);
    }
}

interface JusticeUserForm {
    username: FormControl<string>;
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    contactTelephone: FormControl<string>;
    roles: FormArray<FormControl<boolean>>;
}
