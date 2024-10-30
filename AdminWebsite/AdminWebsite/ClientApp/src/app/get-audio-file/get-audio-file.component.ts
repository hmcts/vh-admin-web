import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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

    constructor(private readonly fb: FormBuilder, private readonly logger: Logger) {}

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
