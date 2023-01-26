import { FormBuilder } from '@angular/forms';
import { AudioLinkService } from '../services/audio-link-service';
import { Logger } from '../services/logger';
import { GetAudioFileComponent } from './get-audio-file.component';

describe('GetAudioFileComponent', () => {
    let formBuilder: FormBuilder;
    let component: GetAudioFileComponent;
    const logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'error', 'warn']);

    beforeAll(async () => {
        formBuilder = new FormBuilder();
        component = new GetAudioFileComponent(formBuilder, logger);
        await component.ngOnInit();
    });

    it('should get the search choice from the getCvpAudioFileForm', async () => {
        component.form.controls['searchChoice'].setValue('vhFile');
        expect(component.searchChoice).toBe('vhFile');
    });
});
