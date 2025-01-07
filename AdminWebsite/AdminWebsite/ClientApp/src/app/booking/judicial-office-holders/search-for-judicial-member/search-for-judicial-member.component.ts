import { AfterContentChecked, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JudicialService } from '../../services/judicial.service';
import { JudiciaryPerson } from 'src/app/services/clients/api-client';
import { debounceTime, tap } from 'rxjs';
import { JudicialMemberDto } from '../models/add-judicial-member.model';
import { Constants } from '../../../common/constants';
import { InterpreterSelectedDto } from '../../interpreter-form/interpreter-selected.model';
import { InterpreterFormComponent } from '../../interpreter-form/interpreter-form.component';
import { FeatureFlags } from 'src/app/services/launch-darkly.service';

@Component({
    selector: 'app-search-for-judicial-member',
    templateUrl: './search-for-judicial-member.component.html',
    styleUrls: ['./search-for-judicial-member.component.scss']
})
export class SearchForJudicialMemberComponent implements AfterContentChecked {
    readonly NotificationDelayTime = 1200;
    get isSelectedAccountGeneric(): boolean {
        return this.judicialMember?.isGeneric;
    }
    form: FormGroup<SearchForJudicialMemberForm>;
    searchResult: JudiciaryPerson[] = [];
    showResult = false;
    judicialMember: JudicialMemberDto;
    interpreterSelection: InterpreterSelectedDto;
    featureFlags = FeatureFlags;

    @Input() saveButtonText = 'Save';
    @Input() existingJudicialMembers: JudicialMemberDto[] = [];
    @Input() set existingJudicialMember(judicialMember: JudicialMemberDto) {
        if (judicialMember) {
            this.form.setValue(
                {
                    judiciaryEmail: judicialMember.email,
                    displayName: judicialMember.displayName,
                    optionalContactEmail: judicialMember.optionalContactEmail ?? null,
                    optionalContactTelephone: judicialMember.optionalContactNumber ?? null
                },
                { emitEvent: false, onlySelf: true }
            );
            this.judicialMember = judicialMember;
            this.form.controls.judiciaryEmail.disable();
            this.editMode = true;
        } else {
            this.editMode = false;
            this.form.controls.judiciaryEmail.enable();
        }
    }

    @Output() judicialMemberSelected = new EventEmitter<JudicialMemberDto>();

    @ViewChild('interpreterForm', { static: false }) interpreterForm: InterpreterFormComponent;

    private editMode = false;

    constructor(private readonly judiciaryService: JudicialService, private readonly cdr: ChangeDetectorRef) {
        this.createForm();
    }

    ngAfterContentChecked(): void {
        if (this.judicialMember) {
            this.interpreterForm?.prepopulateForm(this.judicialMember.interpretationLanguage);
        }
    }

    createForm() {
        this.form = new FormGroup<SearchForJudicialMemberForm>({
            judiciaryEmail: new FormControl<string>('', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]),
            displayName: new FormControl<string>('', [
                Validators.pattern(Constants.TextInputPatternDisplayName),
                Validators.maxLength(255)
            ]),
            optionalContactEmail: new FormControl<string>(null, [Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)]),
            optionalContactTelephone: new FormControl<string>(null, [Validators.pattern(Constants.PhonePattern), Validators.maxLength(255)])
        });

        this.form.controls.judiciaryEmail.valueChanges
            .pipe(
                tap(() => {
                    this.form.controls.displayName.removeValidators(Validators.required);
                    this.form.controls.displayName.updateValueAndValidity({ emitEvent: false });
                }),
                debounceTime(this.NotificationDelayTime)
            )
            .subscribe(newJudiciaryEmail => {
                if (newJudiciaryEmail === '') {
                    this.showResult = false;
                    this.form.reset({
                        judiciaryEmail: '',
                        displayName: '',
                        optionalContactEmail: null,
                        optionalContactTelephone: null
                    });
                }

                if (this.form.controls.judiciaryEmail.invalid) {
                    return;
                }
                if (this.editMode) {
                    return;
                }
                this.searchForJudicialMember();
            });
    }

    searchForJudicialMember() {
        this.judiciaryService.getJudicialUsers(this.form.value.judiciaryEmail).subscribe(result => {
            // exclude existing judicial members from search results
            result = result.filter(x => !this.existingJudicialMembers.find(y => y.personalCode === x.personal_code));
            this.searchResult = result;
            this.showResult = true;
            this.form.controls.displayName.addValidators(Validators.required);
            this.form.controls.displayName.updateValueAndValidity({ emitEvent: false });
        });
    }

    selectJudicialMember(judicialMember: JudiciaryPerson) {
        this.form.setValue(
            {
                judiciaryEmail: judicialMember.email,
                displayName: judicialMember.full_name,
                optionalContactEmail: null,
                optionalContactTelephone: null
            },
            { emitEvent: false, onlySelf: true }
        );
        this.judicialMember = new JudicialMemberDto(
            judicialMember.first_name,
            judicialMember.last_name,
            judicialMember.full_name,
            judicialMember.email,
            judicialMember.work_phone,
            judicialMember.personal_code,
            judicialMember.is_generic
        );
        this.showResult = false;
    }

    confirmJudiciaryMemberWithAdditionalContactDetails() {
        const includeInterpreter = this.interpreterForm ?? false;
        this.interpreterForm?.forceValidation();

        if (!this.form.valid || (includeInterpreter && !this.interpreterForm?.form.valid)) {
            return;
        }
        this.judicialMember.displayName = this.form.controls.displayName.value;
        if (this.judicialMember.isGeneric) {
            this.judicialMember.optionalContactNumber = this.form.value.optionalContactTelephone;
            this.judicialMember.optionalContactEmail = this.form.value.optionalContactEmail;
        }

        this.judicialMemberSelected.emit(this.judicialMember);
        this.form.reset();
        this.interpreterForm?.resetForm();

        this.form.controls.displayName.removeValidators(Validators.required);
    }

    get displayNameFieldHasError(): boolean {
        return this.form.controls.displayName.invalid && this.form.controls.displayName.dirty;
    }

    get displayContactEmailError(): boolean {
        return this.form.controls.optionalContactEmail.invalid && this.form.controls.optionalContactEmail.dirty;
    }

    get displayContactTelephoneError(): boolean {
        return this.form.controls.optionalContactTelephone.invalid && this.form.controls.optionalContactTelephone.dirty;
    }

    onInterpreterLanguageSelected($event: InterpreterSelectedDto) {
        this.interpreterSelection = $event;
        if (!$event.interpreterRequired) {
            this.interpreterSelection = null;
            this.judicialMember = this.judicialMember.clone();
            this.judicialMember.interpretationLanguage = null;
        } else {
            this.judicialMember = this.judicialMember.clone();
            this.judicialMember.interpretationLanguage = $event;
        }
    }
}

interface SearchForJudicialMemberForm {
    judiciaryEmail: FormControl<string>;
    displayName: FormControl<string>;
    optionalContactEmail: FormControl<string | null>;
    optionalContactTelephone: FormControl<string | null>;
}
