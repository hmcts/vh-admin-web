import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HearingAudioSearchModel } from 'src/app/common/model/hearing-audio-search-model';
import { AudioLinkService, IVhAudioRecordingResult } from 'src/app/services/audio-link-service';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-get-audio-file-vh',
    templateUrl: './get-audio-file-vh.component.html'
})
export class GetAudioFileVhComponent implements OnInit {
    constructor(private fb: FormBuilder, private audioLinkService: AudioLinkService, private logger: Logger) {}

    get caseNumber() {
        return this.vhAudioFileForm.get('caseNumber');
    }

    get vhDate() {
        return this.vhAudioFileForm.get('vhDate');
    }

    get vhSearchCriteriaSet(): boolean {
        return this.caseNumber.value || this.vhDate.value;
    }

    get vhDateInvalid() {
        const todayDate = new Date(new Date());
        return new Date(this.vhDate.value) > todayDate && (this.vhDate.dirty || this.vhDate.touched);
    }
    private readonly loggerPrefix = '[GetAudioFileVh] -';
    vhAudioFileForm: FormGroup;
    searchResult: IVhAudioRecordingResult;
    results: HearingAudioSearchModel[];
    today = new Date();
    private setResults(searchResult: IVhAudioRecordingResult) {
        this.results = searchResult?.result?.map(x => new HearingAudioSearchModel(x)) ?? [];
    }

    async ngOnInit(): Promise<void> {
        this.logger.debug(`${this.loggerPrefix} Landed on get audio file`);

        this.vhAudioFileForm = this.fb.group({
            caseNumber: [null],
            vhDate: [null]
        });
    }

    async search() {
        if (this.searchResult) {
            this.searchResult = null;
        }

        this.logger.debug(`${this.loggerPrefix} Attempting to search for audio recording`);
        if (this.vhSearchCriteriaSet) {
            const date: Date = this.vhDate.value ? new Date(this.vhDate.value) : undefined;
            const caseNumber: string = this.caseNumber.value ? this.caseNumber.value : undefined;

            this.logger.debug(`${this.loggerPrefix} Getting results by case number/date`, { caseNumber, date });
            this.searchResult = await this.audioLinkService.searchForHearingsByCaseNumberOrDate(caseNumber, date);
            this.setResults(this.searchResult);

            if (this.searchResult.error) {
                this.logger.error(
                    `${this.loggerPrefix} Error retrieving vh audio file link for: ${date} and ${caseNumber}`,
                    this.searchResult.error
                );
            }
        }
    }
}
