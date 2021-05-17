import { FormBuilder } from '@angular/forms';
import { HearingAudioSearchModel } from '../common/model/hearing-audio-search-model';
import { AudioLinkService } from '../services/audio-link-service';
import { Logger } from '../services/logger';
import { GetAudioFileComponent } from './get-audio-file.component';

describe('GetAudioFileComponent', () => {
    let audioLinkService: jasmine.SpyObj<AudioLinkService>;
    let formBuilder: FormBuilder;
    let component: GetAudioFileComponent;
    const logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'error', 'warn']);

    beforeAll(async () => {
        audioLinkService = jasmine.createSpyObj<AudioLinkService>('AudioLinkService', [
            'searchForHearingsByCaseNumberOrDate',
            'getCvpAudioRecordings',
            'getCvpAudioRecordings',
            'getCvpAudioRecordings'
        ]);
        formBuilder = new FormBuilder();
        component = new GetAudioFileComponent(formBuilder, audioLinkService, logger);
        await component.ngOnInit();
    });

    it('should get the search choice from the getCvpAudioFileForm', async () => {
        component.form.controls['searchChoice'].setValue('vhFile');
        expect(component.searchChoice).toBe('vhFile');
    });
});
