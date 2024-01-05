import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JudicialService } from '../../services/judicial.service';
import { JudiciaryPerson } from 'src/app/services/clients/api-client';
import { debounceTime, tap } from 'rxjs';
import { JudicialMemberDto } from '../models/add-judicial-member.model';
import { Constants } from '../../../common/constants';
import { HoursType } from "../../../common/model/hours-type";

@Component({
    selector: 'app-search-for-judicial-member',
    templateUrl: './search-for-judicial-member.component.html',
    styleUrls: ['./search-for-judicial-member.component.scss']
})
export class SearchForJudicialMemberComponent {
    readonly NotificationDelayTime = 1200;

    form: FormGroup<SearchForJudicialMemberForm>;
    searchResult: JudiciaryPerson[] = [];
    showResult = false;

    @Input() saveButtonText = 'Save';
    @Input() existingJudicialMembers: JudicialMemberDto[] = [];
    @Input() set existingJudicialMember(judicialMember: JudicialMemberDto) {
        if (judicialMember) {
            this.form.setValue(
                { judiciaryEmail: judicialMember.email, displayName: judicialMember.displayName },
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
            judiciaryEmail: new FormControl<string>('', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]),
            displayName: new FormControl<string>('', [Validators.pattern(Constants.TextInputPatternDisplayName), Validators.maxLength(255)])
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
                        displayName: ''
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
        const optional_contact_telephone = '';
        const optional_contact_email = ''
        this.form.setValue(
            { judiciaryEmail: judicialMember.email, displayName: judicialMember.full_name },
            { emitEvent: false, onlySelf: true }
        );
        this.judicialMember = new JudicialMemberDto(
            judicialMember.first_name,
            judicialMember.last_name,
            judicialMember.full_name,
            judicialMember.email,
            judicialMember.work_phone,
            judicialMember.personal_code,
            judicialMember.is_generic,
            optional_contact_telephone,
            optional_contact_email
        );

        this.showResult = false;
    }

    confirmJudiciaryMemberWithDisplayName() {
        this.judicialMember.displayName = this.form.controls.displayName.value;
        this.judicialMemberSelected.emit(this.judicialMember);
        this.form.reset({
            judiciaryEmail: '',
            displayName: ''
        });
        this.form.controls.displayName.removeValidators(Validators.required);
    }

    get displayNameFieldHasError(): boolean {
        return this.form.controls.displayName.invalid && this.form.controls.displayName.dirty;
    }
}

interface SearchForJudicialMemberForm {
    judiciaryEmail: FormControl<string>;
    displayName: FormControl<string>;
}
