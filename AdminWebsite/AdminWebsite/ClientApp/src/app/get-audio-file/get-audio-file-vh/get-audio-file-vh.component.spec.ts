import { fakeAsync, flush } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { AudioLinkService, IVhAudioRecordingResult } from 'src/app/services/audio-link-service';
import { Logger } from 'src/app/services/logger';

import { GetAudioFileVhComponent } from './get-audio-file-vh.component';
import { HearingsForAudioFileSearchResponse } from 'src/app/services/clients/api-client';

describe('GetAudioFileVhComponent', () => {
    let component: GetAudioFileVhComponent;

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
        component = new GetAudioFileVhComponent(formBuilder, audioLinkService, logger);

        await component.ngOnInit();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get the case number from the form', async () => {
        component.caseNumber.setValue('case 123');
        expect(component.caseNumber.value).toBe('case 123');
    });

    it('should keep the results as empty when form is not valid', async () => {
        component.caseNumber.setValue('');
        await component.search();

        expect(component.searchResult).toBeUndefined();
    });

    it('should keep the results as empty when service returns null', async () => {
        audioLinkService.searchForHearingsByCaseNumberOrDate.and.returnValue(
            Promise.resolve({ result: null, status: 200, error: undefined })
        );

        component.caseNumber.setValue('123');
        await component.search();

        expect(component.results).toEqual([]);
    });

    it('should set the results', async () => {
        // Arrange
        const result = [
            new HearingsForAudioFileSearchResponse({
                id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC1'
            }),
            new HearingsForAudioFileSearchResponse({
                id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC2'
            })
        ];

        component.vhDate.setValue(null);
        component.caseNumber.setValue('123');

        const response: IVhAudioRecordingResult = { result: result, status: 200, error: undefined };
        audioLinkService.searchForHearingsByCaseNumberOrDate.and.returnValue(Promise.resolve(response));

        // Act
        await component.search();

        // Assert
        expect(component.results).toBeTruthy();
        expect(component.results.length).toBe(2);
    });

    it('should set date to undefined when not set on search', async () => {
        // Arrange
        component.vhDate.setValue(null);
        component.caseNumber.setValue('123');

        audioLinkService.searchForHearingsByCaseNumberOrDate.and.returnValue(
            Promise.resolve({ result: null, status: 200, error: undefined })
        );

        // Act
        await component.search();

        // Assert
        expect(audioLinkService.searchForHearingsByCaseNumberOrDate).toHaveBeenCalledWith('123', undefined);
    });

    it('should set case number to undefined when not set on search', async () => {
        // Arrange
        const date = new Date();
        component.vhDate.setValue(date);
        component.caseNumber.setValue(null);

        audioLinkService.searchForHearingsByCaseNumberOrDate.and.returnValue(
            Promise.resolve({ result: null, status: 200, error: undefined })
        );

        // Act
        await component.search();

        // Assert
        expect(audioLinkService.searchForHearingsByCaseNumberOrDate).toHaveBeenCalledWith(undefined, date);
    });
    it('should reset the current search results when a new search is made', fakeAsync(() => {
        // Arrange
        component.searchResult = { status: 200, result: null, error: undefined };

        // Act
        component.search();
        flush();

        // Assert
        expect(component.vhSearchCriteriaSet);
        expect(component.searchResult).toBeNull();
        expect(component.results).toEqual([]);
    }));
});
