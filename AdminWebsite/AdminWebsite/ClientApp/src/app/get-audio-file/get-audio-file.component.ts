import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserDataService } from '../services/user-data.service';
import { Logger } from '../services/logger';
import { CaseNumberSearchResultModel } from '../common/model/case-number-search-result.model';

@Component({
    selector: 'app-get-audio-file',
    templateUrl: './get-audio-file.component.html'
    // styleUrls: ['./participant-status.component.scss']
})
export class GetAudioFileComponent implements OnInit {
    form: FormGroup;
    hasSearched: boolean;
    loadingData: boolean;
    results: CaseNumberSearchResultModel[] = [];

    constructor(private fb: FormBuilder, private userDataService: UserDataService, private logger: Logger) {
        this.loadingData = false;
        this.hasSearched = false;
    }

    async ngOnInit(): Promise<void> {
        this.form = this.fb.group({
            caseNumber: ['', Validators.required]
        });
    }

    get caseNumber() {
        return this.form.get('caseNumber');
    }

    async search() {
        if (this.form.valid) {
            this.loadingData = true;
            this.hasSearched = true;
            this.results = [];
            await this.getResults(this.caseNumber.value);
            this.loadingData = false;
        }
    }

    async getResults(caseNumber: string) {
        // Temp
        if (caseNumber !== 'one') {
            this.results = [];
            return;
        }

        for (let i = 0; i < 10; i++) {
            // Do map here from apiResponse
            this.results.push(
                new CaseNumberSearchResultModel({
                    caseName: `${i}: caseName`,
                    caseNumber: `${i}: caseNumber`,
                    scheduledDateTime: `${i}: scheduledDateTime`
                })
            );
        }
    }

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).focus();
    }
}
