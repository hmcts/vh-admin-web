import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AudioLinkService, ICvpAudioRecordingResult } from '../services/audio-link-service';
import { Logger } from '../services/logger';

@Component({
    selector: 'app-get-audio-file',
    templateUrl: './get-audio-file.component.html',
    styleUrls: ['./get-audio-file.component.scss']
})
export class GetAudioFileComponent implements OnInit {
    private readonly loggerPrefix = '[GetAudioFile] -';
    form: FormGroup;
    today = new Date();

    constructor(private fb: FormBuilder, private audioLinkService: AudioLinkService, private logger: Logger) {}

    async ngOnInit(): Promise<void> {
        this.logger.debug(`${this.loggerPrefix} Landed on get audio file`);

        this.form = this.fb.group({
            searchChoice: ['vhFile']
        });
    }

    get searchChoice() {
        return this.form.controls['searchChoice'].value;
    }
}
