import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JudicialService } from '../../services/judicial.service';
import { JudiciaryPersonResponse, PersonResponse } from 'src/app/services/clients/api-client';
import { debounceTime } from 'rxjs';
import { JudicialMemberDto } from '../models/add-judicial-member.model';

@Component({
    selector: 'app-search-for-judicial-member',
    templateUrl: './search-for-judicial-member.component.html',
    styleUrls: ['./search-for-judicial-member.component.scss']
})
export class SearchForJudicialMemberComponent implements OnInit {
    form: FormGroup<SearchForJudicialMemberForm>;
    searchResult: JudiciaryPersonResponse[] = [];
    showResult = false;
    @Output() judicialMemberSelected = new EventEmitter<JudicialMemberDto>();

    constructor(private judiciaryService: JudicialService) {}

    ngOnInit(): void {
        this.createForm();
    }

    searchForJudicialMember() {
        this.judiciaryService.getJudicialUsers(this.form.value.judiciaryEmail).subscribe(result => {
            this.searchResult = result;
            this.showResult = true;
        });
    }

    selectJudicialMember(judicialMember: JudiciaryPersonResponse) {
        const judicialMemberDto = new JudicialMemberDto(
            judicialMember.first_name,
            judicialMember.last_name,
            judicialMember.email,
            judicialMember.personal_code
        );
        this.judicialMemberSelected.emit(judicialMemberDto);
        this.showResult = false;
        // this.form.controls.judiciaryEmail.setValue('');
        this.form.reset({
            judiciaryEmail: ''
        });
    }

    private createForm() {
        this.form = new FormGroup<SearchForJudicialMemberForm>({
            judiciaryEmail: new FormControl<string>('', [Validators.required, Validators.minLength(3)])
        });

        this.form.valueChanges.pipe(debounceTime(1200)).subscribe(() => {
            if (this.form.invalid) return;
            this.searchForJudicialMember();
        });
    }
}

interface SearchForJudicialMemberForm {
    judiciaryEmail: FormControl<string>;
}
