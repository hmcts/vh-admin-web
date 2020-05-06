import { AudioLinkService } from '../services/audio-link-service';
import { GetAudioFileComponent } from './get-audio-file.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HearingAudioSearchModel } from '../common/model/hearing-audio-search-model';

describe('GetAudioFileComponent', () => {
    let audioLinkService: jasmine.SpyObj<AudioLinkService>;
    let formBuilder: FormBuilder;
    let form: FormGroup;
    let component: GetAudioFileComponent;

    beforeAll(async () => {
        audioLinkService = jasmine.createSpyObj<AudioLinkService>('AudioLinkService', ['getHearingsByCaseNumber']);
        formBuilder = new FormBuilder();
        form = formBuilder.group({
            caseNumber: ['', Validators.required]
        });
        component = new GetAudioFileComponent(formBuilder, audioLinkService);
        await component.ngOnInit();
    });

    it('should get the case number from the form', async () => {
        component.form.setValue({ caseNumber: 'case 123' });

        expect(component.caseNumber.value).toBe('case 123');
    });

    it('should keep the results as empty when form is not valid', async () => {
        audioLinkService.getHearingsByCaseNumber.and.returnValue(Promise.resolve([]));

        await component.search();

        expect(component.results).toEqual([]);
        expect(component.loadingData).toBeFalsy();
        expect(component.hasSearched).toBeTruthy();
    });

    it('should keep the results as empty when service returns null', async () => {
        audioLinkService.getHearingsByCaseNumber.and.returnValue(Promise.resolve(null));

        await component.search();

        expect(component.results).toEqual([]);
        expect(component.loadingData).toBeFalsy();
        expect(component.hasSearched).toBeTruthy();
    });

    it('should set the results', async () => {
        const models = [
            new HearingAudioSearchModel({
                init(_data?: any): void {},
                toJSON(data?: any): any {},
                id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC1'
            }),
            new HearingAudioSearchModel({
                init(_data?: any): void {},
                toJSON(data?: any): any {},
                id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC2'
            })
        ];
        audioLinkService.getHearingsByCaseNumber.and.returnValue(Promise.resolve(models));

        await component.search();

        expect(component.results).not.toBeNull();
        expect(component.results).not.toBeUndefined();
        expect(component.results).not.toEqual([]);
        expect(component.loadingData).toBeFalsy();
        expect(component.hasSearched).toBeTruthy();
    });
});
