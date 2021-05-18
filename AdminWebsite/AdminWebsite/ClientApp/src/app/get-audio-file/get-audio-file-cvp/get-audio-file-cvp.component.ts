import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CvpAudioSearchModel } from 'src/app/common/model/cvp-audio-search-model';
import { AudioLinkService, ICvpAudioRecordingResult } from 'src/app/services/audio-link-service';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-get-audio-file-cvp',
    templateUrl: './get-audio-file-cvp.component.html'
})
export class GetAudioFileCvpComponent implements OnInit {
    private readonly loggerPrefix = '[GetAudioFileCvp] -';
    cvpAudioFileForm: FormGroup;
    today = new Date();

    searchResult: ICvpAudioRecordingResult = null;
    get cvpResults(): CvpAudioSearchModel[] {
        return !this.searchResult?.result ? [] : (this.searchResult?.result).map(x => new CvpAudioSearchModel(x));
    }

    constructor(private fb: FormBuilder, private audioLinkService: AudioLinkService, private logger: Logger) {}

    ngOnInit(): void {
        const hearingDateParsed = null;

        this.cvpAudioFileForm = this.fb.group({
            hearingDate: [hearingDateParsed, Validators.required],
            cloudroomName: ['', [Validators.pattern('^[0-9]*$')]],
            caseReference: ['']
        });
    }

    get cloudroomName() {
        return this.cvpAudioFileForm.get('cloudroomName');
    }

    get hearingDate() {
        return this.cvpAudioFileForm.get('hearingDate');
    }

    get caseReference() {
        return this.cvpAudioFileForm.get('caseReference');
    }

    get cvpRequestInvalid() {
        return (
            this.cloudroomName.invalid ||
            this.hearingDate.invalid ||
            this.hearingDateInvalid ||
            (this.cloudroomName.value.length === 0 && this.caseReference.value.length === 0)
        );
    }

    get cloudroomNameInvalid() {
        return this.cloudroomName.invalid && this.cloudroomName.value.length > 0;
    }

    get hearingDateInvalid() {
        const todayDate = new Date(new Date());
        return (
            (this.hearingDate.invalid || new Date(this.hearingDate.value) > todayDate) &&
            (this.hearingDate.dirty || this.hearingDate.touched)
        );
    }

    async search() {
        if (this.searchResult) {
            this.searchResult = null;
        }

        this.logger.debug(`${this.loggerPrefix} Attempting to search for audio recording`);
        if (!this.cvpRequestInvalid) {
            this.logger.debug(`${this.loggerPrefix} Getting CVP audio recordings`, {
                cloudRoom: this.cloudroomName.value,
                date: this.hearingDate.value,
                caseReference: this.caseReference.value
            });

            this.searchResult = await this.audioLinkService.getCvpAudioRecordings(
                this.cloudroomName.value,
                this.hearingDate.value,
                this.caseReference.value
            );

            if (this.searchResult.error) {
                this.logger.error(
                    `${this.loggerPrefix} Error retrieving cvp audio file link for: ${this.cloudroomName.value}, ${this.hearingDate.value}, ${this.caseReference.value}`,
                    this.searchResult.error
                );
            }
        }
    }
}
