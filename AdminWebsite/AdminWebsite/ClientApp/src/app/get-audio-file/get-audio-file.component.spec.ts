import { AudioLinkService } from '../services/audio-link-service';
import { GetAudioFileComponent } from './get-audio-file.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HearingAudioSearchModel } from '../common/model/hearing-audio-search-model';
import { CvpAudioSearchModel } from '../common/model/cvp-audio-search-model';
import { CvpForAudioFileResponse } from '../services/clients/api-client';

describe('GetAudioFileComponent', () => {
    let audioLinkService: jasmine.SpyObj<AudioLinkService>;
    let formBuilder: FormBuilder;
    let component: GetAudioFileComponent;

    beforeAll(async () => {
        audioLinkService = jasmine.createSpyObj<AudioLinkService>('AudioLinkService', [
            'getHearingsByCaseNumber',
            'getCvpAudioLinkWithCaseReference',
            'getCvpAudioLink'
        ]);
        formBuilder = new FormBuilder();
        component = new GetAudioFileComponent(formBuilder, audioLinkService);
        await component.ngOnInit();
    });

    it('should get the case number from the form', async () => {
        component.caseNumber.setValue('case 123');
        expect(component.caseNumber.value).toBe('case 123');
    });

    it('should keep the results as empty when form is not valid', async () => {
        component.caseNumber.setValue('');
        await component.search();

        expect(component.results).toEqual([]);
        expect(component.hasSearched).toBeFalsy();
    });

    it('should keep the results as empty when service returns null', async () => {
        audioLinkService.getHearingsByCaseNumber.and.returnValue(Promise.resolve(null));

        component.caseNumber.setValue('123');
        await component.search();

        expect(component.results).toEqual([]);
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
        expect(component.hasSearched).toBeTruthy();
    });
    it('should get the cloudroom name from the form', async () => {
        component.cloudroomName.setValue('000101');
        expect(component.cloudroomName.value).toBe('000101');
    });
    it('should get the case reference from the form', async () => {
        component.caseReference.setValue('reference1');
        expect(component.caseReference.value).toBe('reference1');
    });
    it('should get the search choice from the form', async () => {
        component.form.controls['searchChoice'].setValue('vhFile');
        expect(component.searchChoice).toBe('vhFile');
    });
    it('should get the hearing date from the form', async () => {
        const date = Date.now;
        component.hearingDate.setValue(date);
        expect(component.hearingDate.value).toBe(date);
    });
    it('should validate hearing date as invalid', () => {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours() + 1;
        const date = todayDate.setHours(todayHours, 0, 0, 0);

        component.hearingDate.setValue(date);
        component.hearingDate.markAsTouched();

        expect(component.hearingDateInvalid).toBeTruthy();
    });
    it('should get valid hearing date', () => {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours() - 1;
        const date = todayDate.setHours(todayHours, 0, 0, 0);
        component.hearingDate.setValue(date);
        expect(component.hearingDateInvalid).toBeFalsy();
    });
    it('should validate cvp search parameters as valid', () => {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours() - 1;
        const date = todayDate.setHours(todayHours, 0, 0, 0);

        component.hearingDate.setValue(date);
        component.cloudroomName.setValue('000101');
        component.hearingDate.markAsTouched();

        expect(component.cvpRequestInvalid).toBeFalsy();
    });
    it('should validate cvp search parameters as invalid', () => {
        const todayDate = new Date(new Date().setHours(0, 0, 0, 0));
        const todayHours = new Date().getHours() + 1;
        const date = todayDate.setHours(todayHours, 0, 0, 0);

        component.hearingDate.setValue(date);
        component.cloudroomName.setValue('');

        expect(component.cvpRequestInvalid).toBeTruthy();
    });
    it('should validate cloudroom name as invalid', () => {
        component.cloudroomName.setValue('');
        component.cloudroomName.markAsTouched();

        expect(component.cloudroomNameInvalid).toBeTruthy();
    });
    it('should validate cloudroom name as invalid if not numeric', () => {
        component.cloudroomName.setValue('cloudroom1111');
        component.cloudroomName.markAsTouched();

        expect(component.cloudroomNameInvalid).toBeTruthy();
    });
    it('should validate cloudroom name as valid', () => {
        component.cloudroomName.setValue('1231');
        component.cloudroomName.markAsTouched();

        expect(component.cloudroomNameInvalid).toBeFalsy();
    });
    it('should clear value of fields on the change search', () => {
        component.searchChoiceClick();
        expect(component.cloudroomName.value).toBe('');
        expect(component.caseNumber.value).toBe('');
        expect(component.caseReference.value).toBe('');
        expect(component.hasSearched).toBe(false);
        expect(component.hasCvpSearched).toBe(false);
        expect(component.cvpResults.length).toBe(0);
        expect(component.results.length).toBe(0);
    });
    it('should keep the results as empty when cvp audio files not found and service returns null', async () => {
        audioLinkService.getCvpAudioLink.and.returnValue(Promise.resolve(null));

        component.caseReference.setValue('');
        component.cloudroomName.setValue('000101');
        component.hearingDate.setValue('2020-08-04');
        await component.searchCVP();

        expect(component.cvpResults).toEqual([]);
        expect(component.hasCvpSearched).toBeTruthy();
        expect(audioLinkService.getCvpAudioLink).toHaveBeenCalled();
    });
    it('should keep the results as empty when cvp audio files with case reference not found and service returns null', async () => {
        audioLinkService.getCvpAudioLinkWithCaseReference.and.returnValue(Promise.resolve(null));

        component.caseReference.setValue('123');
        component.cloudroomName.setValue('000101');
        component.hearingDate.setValue('2020-08-04');
        await component.searchCVP();

        expect(component.cvpResults).toEqual([]);
        expect(component.hasCvpSearched).toBeTruthy();
        expect(audioLinkService.getCvpAudioLinkWithCaseReference).toHaveBeenCalled();
    });
    it('should get the results when cvp audio files are found and service returns result', async () => {
        const result = [
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' })),
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' }))
        ];
        audioLinkService.getCvpAudioLink.and.returnValue(Promise.resolve(result));

        component.caseReference.setValue('');
        component.cloudroomName.setValue('000101');
        component.hearingDate.setValue('2020-08-04');
        await component.searchCVP();

        expect(component.cvpResults.length).toBe(2);
        expect(component.hasCvpSearched).toBeTruthy();
        expect(audioLinkService.getCvpAudioLink).toHaveBeenCalled();
    });
    it('should get the results when cvp audio files with case reference are found and service returns result', async () => {
        const result = [
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' })),
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' }))
        ];
        audioLinkService.getCvpAudioLinkWithCaseReference.and.returnValue(Promise.resolve(result));

        component.caseReference.setValue('123');
        component.cloudroomName.setValue('000101');
        component.hearingDate.setValue('2020-08-04');
        await component.searchCVP();

        expect(component.cvpResults.length).toBe(2);
        expect(component.hasCvpSearched).toBeTruthy();
        expect(audioLinkService.getCvpAudioLinkWithCaseReference).toHaveBeenCalled();
    });
});
