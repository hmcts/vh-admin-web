import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HearingAudioSearchModel } from '../common/model/hearing-audio-search-model';
import { CvpAudioSearchModel } from '../common/model/cvp-audio-search-model';
import { AudioLinkService } from '../services/audio-link-service';
import { CvpForAudioFileResponse } from '../services/clients/api-client';

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
    cvpResults: CvpAudioSearchModel[] = [];
    today = new Date();

    constructor(private fb: FormBuilder, private audioLinkService: AudioLinkService) {
        this.hasSearched = false;
        this.hasCvpSearched = false;
    }

    async ngOnInit(): Promise<void> {
        const hearingDateParsed = null;

        this.form = this.fb.group({
            caseNumber: [null],
            vhDate: [null],
            searchChoice: ['vhFile'],
            hearingDate: [hearingDateParsed, Validators.required],
            cloudroomName: ['', [Validators.pattern('^[0-9]*$')]],
            caseReference: ['']
        });
    }

    get caseNumber() {
        return this.form.get('caseNumber');
    }

    get vhDate() {
        return this.form.get('vhDate');
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

    get vhDateInvalid() {
        const todayDate = new Date(new Date());
        return new Date(this.vhDate.value) > todayDate && (this.vhDate.dirty || this.vhDate.touched);
    }

    get cvpRequestInvalid() {
        return this.cloudroomName.invalid || this.hearingDate.invalid || this.hearingDateInvalid ||
            (this.cloudroomName.value.length === 0 && this.caseReference.value.length === 0);
    }

    get cloudroomNameInvalid() {
        return this.cloudroomName.invalid && this.cloudroomName.value.length > 0;
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

    get vhSearchCriteriaSet(): boolean {
        return this.caseNumber.value || this.vhDate.value;
    }

    async search() {
        if (this.vhSearchCriteriaSet) {
            this.hasSearched = false;

            const date: Date = this.vhDate.value ? new Date(this.vhDate.value) : undefined;
            const caseNumber: string = this.caseNumber.value ? this.caseNumber.value : undefined;
            this.results = await this.getResults(caseNumber, date);

            this.hasSearched = true;
        }
    }

    async searchCVP() {
        if (!this.cvpRequestInvalid) {
            this.hasCvpSearched = false;

            this.cvpResults = await this.getCvpResults();

            this.hasCvpSearched = true;
        }
    }

    async getResults(caseNumber: string, date?: Date): Promise<HearingAudioSearchModel[]> {
        const response = await this.audioLinkService.searchForHearingsByCaseNumberOrDate(caseNumber, date);

        if (response === null) {
            return [];
        }

        return response.map(x => {
            return new HearingAudioSearchModel(x);
        });
    }

    async getCvpResults(): Promise<CvpAudioSearchModel[]> {
        let response: CvpForAudioFileResponse[];

        if (this.cloudroomName.value && this.hearingDate.value && this.caseReference.value) {
            response = await this.audioLinkService.getCvpAudioRecordingsAll(this.cloudroomName.value,
                this.hearingDate.value,
                this.caseReference.value);
        } else if (this.cloudroomName.value && this.hearingDate.value) {
            response = await this.audioLinkService.getCvpAudioRecordingsByCloudRoom(this.cloudroomName.value, this.hearingDate.value);
        } else {
            response = await this.audioLinkService.getCvpAudioRecordingsByDate(this.hearingDate.value, this.caseReference.value);
        }

        return response === null ? [] : response.map((x) => new CvpAudioSearchModel(x));
    }
}
