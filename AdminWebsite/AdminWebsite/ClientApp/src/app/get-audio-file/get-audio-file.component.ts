import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HearingAudioSearchModel } from '../common/model/hearing-audio-search-model';
import { AudioLinkService } from '../services/audio-link-service';

@Component({
    selector: 'app-get-audio-file',
    templateUrl: './get-audio-file.component.html',
    styleUrls: ['./get-audio-file.component.scss']
})
export class GetAudioFileComponent implements OnInit {
    form: FormGroup;
    hasSearched: boolean;
    hasCvpSearched: boolean;
    results: HearingAudioSearchModel[] = [];
    cvpResults: string[] = [];

    constructor(private fb: FormBuilder, private audioLinkService: AudioLinkService) {
        this.hasSearched = false;
        this.hasCvpSearched = false;
    }

    async ngOnInit(): Promise<void> {
        let hearingDateParsed = null;

        this.form = this.fb.group({
            caseNumber: ['', Validators.required],
            searchChoice: ['vhFile'],
            hearingDate: [hearingDateParsed, Validators.required],
            cloudroomName: ['', Validators.required],
            caseReference: ['']
        });
    }

    get caseNumber() {
        return this.form.get('caseNumber');
    }

    get cloudroomName() {
        return this.form.get('cloudroomName');
    }

    get caseReference() {
        return this.form.get('caseReference');
    }

    get searchChoice() {
        return this.form.controls['searchChoice'].value;
    }

    get hearingDate() {
        return this.form.get('hearingDate');
    }

    get hearingDateInvalid() {
        const todayDate = new Date(new Date());
        return (
            (this.hearingDate.invalid || new Date(this.hearingDate.value) > todayDate) &&
            (this.hearingDate.dirty || this.hearingDate.touched)
        );
    }

    get cvpRequestInvalid() {
        return this.cloudroomName.invalid || this.hearingDate.invalid || this.hearingDateInvalid;
    }

    get cloudroomNameInvalid() {
        return this.cloudroomName.invalid && (this.cloudroomName.dirty || this.cloudroomName.touched);
    }

    searchChoiceClick() {
        this.hasCvpSearched = false;
        this.hasSearched = false;
        this.caseReference.setValue('');
        this.cloudroomName.setValue('');
        this.cloudroomName.markAsPristine();
        this.cloudroomName.markAsUntouched();
        this.hearingDate.setValue('');
        this.hearingDate.markAsUntouched();
        this.hearingDate.markAsPristine();
        this.caseReference.markAsPristine();
        this.cvpResults.length = 0;
        this.caseNumber.setValue('');
        this.caseNumber.markAsUntouched();
        this.results.length = 0;
    }

    async search() {
        if (!this.caseNumber.invalid) {
            this.hasSearched = false;

            this.results = await this.getResults(this.caseNumber.value);

            this.hasSearched = true;
        }
    }

    searchCVP() {
        if (!this.cvpRequestInvalid) {
            this.hasCvpSearched = false;

            this.cvpResults = this.getCvpResults();

            this.hasCvpSearched = true;
        }
    }

    async getResults(caseNumber: string): Promise<HearingAudioSearchModel[]> {
        const response = await this.audioLinkService.getHearingsByCaseNumber(caseNumber);

        if (response === null) {
            return [];
        }

        return response.map(x => {
            return new HearingAudioSearchModel(x);
        });
    }

    getCvpResults() {
        return [
            'FM-0152-ZE186004C1_2020-08-04-09.30.12.316-UTC_0.mp4',
            'FM-0152-ZE186004C1_2020-08-04-09.30.12.316-UTC_0.mp4',
            'FM-0152-ZE186004C1_2020-08-04-09.30.12.316-UTC_0.mp4'
        ];
    }
}
