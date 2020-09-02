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
    loadingData: boolean;
    results: HearingAudioSearchModel[] = [];

    constructor(private fb: FormBuilder, private audioLinkService: AudioLinkService) {
        this.loadingData = false;
        this.hasSearched = false;
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
            (this.hearingDate.dirty || this.hearingDate.touched )
        );
    }

    async search() {
        if (this.form.valid) {
            this.loadingData = true;
            this.hasSearched = false;

            this.results = await this.getResults(this.caseNumber.value);

            this.hasSearched = true;
            this.loadingData = false;
        }
    }

    async getResults(caseNumber: string): Promise<HearingAudioSearchModel[]> {
        const response = await this.audioLinkService.getHearingsByCaseNumber(caseNumber);

        if (response === null) {
            return [];
        }

        return response.map((x) => {
            return new HearingAudioSearchModel(x);
        });
    }
}
