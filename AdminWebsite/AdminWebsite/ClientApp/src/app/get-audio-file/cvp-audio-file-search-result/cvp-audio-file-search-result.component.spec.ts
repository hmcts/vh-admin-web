import { fakeAsync, tick } from '@angular/core/testing';
import { ClipboardService } from 'ngx-clipboard';
import { Logger } from 'src/app/services/logger';
import { CvpAudioSearchModel } from '../../common/model/cvp-audio-search-model';
import { CvpForAudioFileResponse } from '../../services/clients/api-client';
import { CvpAudioFileSearchResultComponent } from './cvp-audio-file-search-result.component';

describe('CvpAudioFileSearchResultComponent', () => {
    let component: CvpAudioFileSearchResultComponent;
    let clipboardService: jasmine.SpyObj<ClipboardService>;
    const logger = jasmine.createSpyObj<Logger>('Logger', ['debug']);

    beforeEach(() => {
        clipboardService = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
        component = new CvpAudioFileSearchResultComponent(clipboardService, logger);
    });

    it('should return has results as false', function () {
        expect(component.hasResults).toBeFalsy();
    });

    it('should return has results as false', function () {
        component.results = [];
        expect(component.hasResults).toBeFalsy();
    });

    it('should return has results as true', function () {
        component.results = [
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'file name1', sas_token_uri: 'some.com' })),
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'file name1', sas_token_uri: 'some.com' }))
        ];
        expect(component.hasResults).toBeTruthy();
    });
    it('should reset to unselected all items in the audio file list', function () {
        component.results = [
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'file name1', sas_token_uri: 'some.com' })),
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'file name1', sas_token_uri: 'some.com' }))
        ];
        component.results[0].selected = true;
        component.hideLinkCopiedMessage();

        expect(component.results[0].selected).toBe(false);
    });
    it('should copy audio link and show copied link message', fakeAsync(async () => {
        component.results = [
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'file name1', sas_token_uri: 'some.com' })),
            new CvpAudioSearchModel(new CvpForAudioFileResponse({ file_name: 'file name1', sas_token_uri: 'some.com' }))
        ];

        await component.onCopyLinkClick(1);
        expect(component.results[1].selected).toBeTruthy();
        tick(3001);
        expect(component.results[1].selected).toBeFalsy();
    }));
});
