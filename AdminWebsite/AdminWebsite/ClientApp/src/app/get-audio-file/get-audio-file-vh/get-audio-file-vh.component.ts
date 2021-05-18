import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HearingAudioSearchModel } from 'src/app/common/model/hearing-audio-search-model';
import { AudioLinkService, IVhAudioRecordingResult } from 'src/app/services/audio-link-service';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-get-audio-file-vh',
    templateUrl: './get-audio-file-vh.component.html',
    styleUrls: ['./get-audio-file-vh.component.css']
})
export class GetAudioFileVhComponent implements OnInit {
    private readonly loggerPrefix = '[GetAudioFileVh] -';
    vhAudioFileForm: FormGroup;
    searchResult: IVhAudioRecordingResult;
    get results(): HearingAudioSearchModel[] {
        return !this.searchResult?.result ? [] : (this.searchResult?.result).map(x => new HearingAudioSearchModel(x));
    }
    today = new Date();

    constructor(private fb: FormBuilder, private audioLinkService: AudioLinkService, private logger: Logger) {}

    async ngOnInit(): Promise<void> {
        this.logger.debug(`${this.loggerPrefix} Landed on get audio file`);

        this.vhAudioFileForm = this.fb.group({
            caseNumber: [null],
            vhDate: [null]
        });
    }

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

    async search() {
        if (this.searchResult)
            this.searchResult = null;

        this.logger.debug(`${this.loggerPrefix} Attempting to search for audio recording`);
        if (this.vhSearchCriteriaSet) {
            const date: Date = this.vhDate.value ? new Date(this.vhDate.value) : undefined;
            const caseNumber: string = this.caseNumber.value ? this.caseNumber.value : undefined;

            this.logger.debug(`${this.loggerPrefix} Getting results by case number/date`, { caseNumber, date });
            this.searchResult = await this.audioLinkService.searchForHearingsByCaseNumberOrDate(caseNumber, date);

            if (this.searchResult.error) {
                this.logger.error(
                    `${this.loggerPrefix} Error retrieving vh audio file link for: ${date} and ${caseNumber}`,
                    this.searchResult.error
                );
            }
        }
    }
}
