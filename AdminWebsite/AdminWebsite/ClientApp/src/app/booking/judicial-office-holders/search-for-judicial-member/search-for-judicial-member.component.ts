import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class SearchForJudicialMemberComponent implements OnInit {
    form: FormGroup<SearchForJudicialMemberForm>;
    searchResult: JudiciaryPerson[] = [];
    showResult = false;

    @Input() saveButtonText = 'Save';
    @Output() judicialMemberSelected = new EventEmitter<JudicialMemberDto>();

    private _judicialMember: JudicialMemberDto;

    constructor(private judiciaryService: JudicialService) {}

    ngOnInit(): void {
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
        this._judicialMember = new JudicialMemberDto(
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
        this._judicialMember.displayName = this.form.controls.displayName.value;
        this.judicialMemberSelected.emit(this._judicialMember);
        this.form.reset({
            judiciaryEmail: '',
            displayName: ''
        });
        this.form.controls.displayName.removeValidators(Validators.required);
    }

    private createForm() {
        this.form = new FormGroup<SearchForJudicialMemberForm>({
            judiciaryEmail: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
            displayName: new FormControl<string>('', [Validators.required])
        });

        this.form.controls.judiciaryEmail.valueChanges
            .pipe(
                tap(() => {
                    this.form.controls.displayName.removeValidators(Validators.required);
                    this.form.controls.judiciaryEmail.updateValueAndValidity({ emitEvent: false });
                }),
                debounceTime(1200)
            )
            .subscribe(newJudiciaryEmail => {
                if (newJudiciaryEmail === '') {
                    this.showResult = false;
                    this.form.reset({
                        judiciaryEmail: '',
                        displayName: ''
                    });
                }

                if (this.form.controls.judiciaryEmail.invalid) return;
                this.searchForJudicialMember();
            });
    }
}

interface SearchForJudicialMemberForm {
    judiciaryEmail: FormControl<string>;
    displayName: FormControl<string>;
}
