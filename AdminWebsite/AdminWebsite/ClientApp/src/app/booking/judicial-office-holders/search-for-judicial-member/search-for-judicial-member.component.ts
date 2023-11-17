import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JudicialService } from '../../services/judicial.service';
import { JudiciaryPerson } from 'src/app/services/clients/api-client';
import { debounceTime, tap } from 'rxjs';
import { JudicialMemberDto } from '../models/add-judicial-member.model';
import { Constants } from 'src/app/common/constants';

@Component({
    selector: 'app-search-for-judicial-member',
    templateUrl: './search-for-judicial-member.component.html',
    styleUrls: ['./search-for-judicial-member.component.scss']
})
export class SearchForJudicialMemberComponent {
    errorMessages = Constants.Error;
    readonly NotificationDelayTime = 1200;

    form: FormGroup<SearchForJudicialMemberForm>;
    searchResult: JudiciaryPerson[] = [];
    showResult = false;

    @Input() saveButtonText = 'Save';
    @Input() existingJudicialMembers: JudicialMemberDto[] = [];
    @Input() set existingJudicialMember(judicialMember: JudicialMemberDto) {
        if (judicialMember) {
            this.form.setValue(
                {
                    judiciaryEmail: judicialMember.email,
                    displayName: judicialMember.displayName,
                    optionalContactEmail: judicialMember.optionalContactEmail,
                    optionalContactTelephone: judicialMember.optionalContactTelephone
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

    judicialMember: JudicialMemberDto;
    private editMode = false;
    constructor(private judiciaryService: JudicialService) {
        this.createForm();
    }

    createForm() {
        this.form = new FormGroup<SearchForJudicialMemberForm>({
            judiciaryEmail: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
            displayName: new FormControl<string>(''),
            optionalContactTelephone: new FormControl<string>('', [Validators.pattern(Constants.PhonePattern)]),
            optionalContactEmail: new FormControl<string>('', [Validators.pattern(Constants.EmailPattern), Validators.maxLength(255)])
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
                        optionalContactTelephone: '',
                        optionalContactEmail: ''
                    });
                    this.judicialMember = null;
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
                optionalContactTelephone: '',
                optionalContactEmail: ''
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

    confirmJudiciaryMemberWithDisplayName() {
        this.judicialMember.displayName = this.form.controls.displayName.value;
        this.judicialMember.optionalContactTelephone = this.form.controls.optionalContactTelephone.value;
        this.judicialMember.optionalContactEmail = this.form.controls.optionalContactEmail.value;
        this.judicialMemberSelected.emit(this.judicialMember);
        this.form.reset({
            judiciaryEmail: '',
            displayName: '',
            optionalContactTelephone: '',
            optionalContactEmail: ''
        });
        this.form.controls.displayName.removeValidators(Validators.required);
    }
}

interface SearchForJudicialMemberForm {
    judiciaryEmail: FormControl<string>;
    displayName: FormControl<string>;
    optionalContactTelephone: FormControl<string>;
    optionalContactEmail: FormControl<string>;
}
