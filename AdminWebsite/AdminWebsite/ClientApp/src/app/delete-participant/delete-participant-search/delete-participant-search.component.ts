import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParticipantHearingDeleteResultModel } from '../../common/model/participant-hearing-delete-result-model';
import { ParticipantDeleteService } from '../../services/participant-delete-service.service';

@Component({
    selector: 'app-delete-participant',
    templateUrl: './delete-participant-search.component.html'
})
export class DeleteParticipantSearchComponent implements OnInit {
    form: FormGroup;
    hasSearched: boolean;
    loadingData: boolean;
    results: ParticipantHearingDeleteResultModel[] = [];
    constructor(private fb: FormBuilder, private service: ParticipantDeleteService) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            username: ['', Validators.required]
        });
    }

    get username() {
        return this.form.get('username');
    }

    async search() {
        if (this.form.valid) {
            this.loadingData = true;
            this.hasSearched = false;

            this.results = await this.getResults(this.username.value);

            this.hasSearched = true;
            this.loadingData = false;
        }
    }

    async getResults(username: string) {
        const response = await this.service.getHearingsForUsername(username);
        if (response) {
            return response.map((x) => {
                return new ParticipantHearingDeleteResultModel(x);
            });
        } else {
            return null;
        }
    }
}
