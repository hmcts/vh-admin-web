import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { HearingAudioSearchModel } from 'src/app/common/model/hearing-audio-search-model';
import { AudioLinkService } from 'src/app/services/audio-link-service';
import { Logger } from 'src/app/services/logger';

import { GetAudioFileVhComponent } from './get-audio-file-vh.component';

describe('GetAudioFileVhComponent', () => {
    let component: GetAudioFileVhComponent;

    let audioLinkService: jasmine.SpyObj<AudioLinkService>;
    let formBuilder: FormBuilder;
    const logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'error', 'warn']);

    beforeAll(async () => {
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

        expect(component.results).toEqual([]);
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
        const result = [
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
        audioLinkService.searchForHearingsByCaseNumberOrDate.and.returnValue(
            Promise.resolve({ result: result, status: 200, error: undefined })
        );

        await component.search();

        expect(component.results).not.toBeNull();
        expect(component.results).not.toBeUndefined();
        expect(component.results).not.toEqual([]);
    });

    it('should set date to undefined when not set on search', async () => {
        component.vhDate.setValue(null);
        component.caseNumber.setValue('123');
        await component.search();
        expect(audioLinkService.searchForHearingsByCaseNumberOrDate).toHaveBeenCalledWith('123', undefined);
    });

    it('should set case number to undefined when not set on search', async () => {
        const date = new Date();
        component.vhDate.setValue(date);
        component.caseNumber.setValue(null);
        await component.search();
        expect(audioLinkService.searchForHearingsByCaseNumberOrDate).toHaveBeenCalledWith(undefined, date);
    });
});
