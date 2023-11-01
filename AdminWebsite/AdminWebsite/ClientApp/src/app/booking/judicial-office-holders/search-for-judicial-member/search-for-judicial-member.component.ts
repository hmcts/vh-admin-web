import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JudicialService } from '../../services/judicial.service';
import { JudiciaryPerson } from 'src/app/services/clients/api-client';
import { debounceTime, tap } from 'rxjs';
import { JudicialMemberDto } from '../models/add-judicial-member.model';

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

    private judicialMember: JudicialMemberDto;
    private editMode = false;
    constructor(private judiciaryService: JudicialService) {
        this.createForm();
    }

    searchForJudicialMember() {
        this.judiciaryService.getJudicialUsers(this.form.value.judiciaryEmail).subscribe(result => {
            this.searchResult = result;
            this.showResult = true;
            this.form.controls.displayName.addValidators(Validators.required);
        });
    }

    selectJudicialMember(judicialMember: JudiciaryPerson) {
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
            judicialMember.personal_code
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

    createForm() {
        this.form = new FormGroup<SearchForJudicialMemberForm>({
            judiciaryEmail: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
            displayName: new FormControl<string>('')
        });

        this.form.controls.judiciaryEmail.valueChanges
            .pipe(
                tap(() => {
                    this.form.controls.displayName.removeValidators(Validators.required);
                    this.form.controls.judiciaryEmail.updateValueAndValidity({ emitEvent: false });
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
}

interface SearchForJudicialMemberForm {
    judiciaryEmail: FormControl<string>;
    displayName: FormControl<string>;
}
