import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JudicialService } from '../../services/judicial.service';
import { PersonResponse } from 'src/app/services/clients/api-client';
import { debounce, debounceTime } from 'rxjs';

@Component({
    selector: 'app-search-for-judicial-member',
    templateUrl: './search-for-judicial-member.component.html',
    styleUrls: ['./search-for-judicial-member.component.scss']
})
export class SearchForJudicialMemberComponent implements OnInit {
    form: FormGroup<SearchForJudicialMemberForm>;
    result: PersonResponse[] = [];

    @Output() judicialMemberSelected = new EventEmitter<PersonResponse>();

    constructor(private judiciaryService: JudicialService) {}

    ngOnInit(): void {
        this.createForm();
    }

    searchForJudicialMember() {
        this.judiciaryService
            .getJudicialUsers(this.form.value.judiciaryEmail)
            .pipe(debounceTime(2000))
            .subscribe(result => (this.result = result));
    }

    selectJudicialMember(judicialMember: PersonResponse) {
        this.judicialMemberSelected.emit(judicialMember);
    }

    private createForm() {
        this.form = new FormGroup<SearchForJudicialMemberForm>({
            judiciaryEmail: new FormControl<string>('', [Validators.required, Validators.minLength(3)])
        });

        this.form.valueChanges.subscribe(() => {
            if (this.form.invalid) return;
            this.searchForJudicialMember();
        });
    }
}

interface SearchForJudicialMemberForm {
    judiciaryEmail: FormControl<string>;
}
