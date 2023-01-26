import { fakeAsync, flush } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { CvpAudioSearchModel } from 'src/app/common/model/cvp-audio-search-model';
import { AudioLinkService } from 'src/app/services/audio-link-service';
import { CvpForAudioFileResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logger';
import { GetAudioFileCvpComponent } from './get-audio-file-cvp.component';

describe('GetAudioFileCvpComponent', () => {
    let component: GetAudioFileCvpComponent;
    let audioLinkService: jasmine.SpyObj<AudioLinkService>;
    let formBuilder: FormBuilder;
    const logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'error', 'warn']);

    beforeEach(async () => {
        audioLinkService = jasmine.createSpyObj<AudioLinkService>('AudioLinkService', [
            'searchForHearingsByCaseNumberOrDate',
            'getCvpAudioRecordings',
            'getCvpAudioRecordings',
            'getCvpAudioRecordings'
        ]);
        formBuilder = new FormBuilder();
        component = new GetAudioFileCvpComponent(formBuilder, audioLinkService, logger);
        await component.ngOnInit();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get the cloudroom name from the getCvpAudioFileForm', async () => {
        component.cloudroomName.setValue('000101');
        expect(component.cloudroomName.value).toBe('000101');
    });
    it('should get the case reference from the getCvpAudioFileForm', async () => {
        component.caseReference.setValue('reference1');
        expect(component.caseReference.value).toBe('reference1');
    });
    it('should get the hearing date from the getCvpAudioFileForm', async () => {
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

    it('should keep the results as empty when cvp audio files not found and service returns null', async () => {
        audioLinkService.getCvpAudioRecordings.and.returnValue(Promise.resolve({ result: null, status: 200, error: undefined }));

        component.caseReference.setValue('');
        component.cloudroomName.setValue('000101');
        component.hearingDate.setValue('2020-08-04');
        await component.search();

        expect(component.results).toEqual([]);
        expect(component.searchResult).toBeTruthy();
        expect(audioLinkService.getCvpAudioRecordings).toHaveBeenCalled();
    });

    it('should keep the results as empty when cvp audio files with case reference not found and service returns null', async () => {
        audioLinkService.getCvpAudioRecordings.and.returnValue(Promise.resolve({ result: null, status: 200, error: undefined }));

        component.caseReference.setValue('123');
        component.cloudroomName.setValue('000101');
        component.hearingDate.setValue('2020-08-04');
        await component.search();

        expect(component.results).toEqual([]);
        expect(component.searchResult).toBeTruthy();
        expect(audioLinkService.getCvpAudioRecordings).toHaveBeenCalled();
    });
    it('should get the results when cvp audio files are found and service returns result', async () => {
        const result = [
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' })),
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' }))
        ];
        audioLinkService.getCvpAudioRecordings.and.returnValue(Promise.resolve({ result: result, status: 200, error: undefined }));

        component.caseReference.setValue('');
        component.cloudroomName.setValue('000101');
        component.hearingDate.setValue('2020-08-04');
        await component.search();

        expect(component.results.length).toBe(2);
        expect(component.searchResult).toBeTruthy();
        expect(audioLinkService.getCvpAudioRecordings).toHaveBeenCalled();
    });
    it('should get the results when cvp audio files with case reference are found and service returns result', async () => {
        const result = [
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' })),
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' }))
        ];
        audioLinkService.getCvpAudioRecordings.and.returnValue(Promise.resolve({ result: result, status: 200, error: undefined }));

        component.caseReference.setValue('123');
        component.cloudroomName.setValue('000101');
        component.hearingDate.setValue('2020-08-04');
        await component.search();

        expect(component.results.length).toBe(2);
        expect(component.searchResult).toBeTruthy();
        expect(audioLinkService.getCvpAudioRecordings).toHaveBeenCalled();
    });
    it('should get the results when cvp audio files by date and case reference', async () => {
        const result = [
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' })),
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'FM-12345-2020-08-09_0.mp4', sas_token_uri: 'goto.audio' }))
        ];
        audioLinkService.getCvpAudioRecordings.and.returnValue(Promise.resolve({ result: result, status: 200, error: undefined }));

        component.caseReference.setValue('caseRef1');
        component.cloudroomName.setValue('');
        component.hearingDate.setValue('2020-08-09');
        await component.search();

        expect(component.results.length).toBe(2);
        expect(component.searchResult).toBeTruthy();
        expect(audioLinkService.getCvpAudioRecordings).toHaveBeenCalled();
    });
    it('should reset the current search results when a new search is made', fakeAsync(() => {
        // Arrange
        component.searchResult = { status: 200, result: null, error: undefined };

        // Act
        component.search();
        flush();

        // Assert
        expect(component.searchResult).toBeNull();
        expect(component.results).toEqual([]);
    }));
});
