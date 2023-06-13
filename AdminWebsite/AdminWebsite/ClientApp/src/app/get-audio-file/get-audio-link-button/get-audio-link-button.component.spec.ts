import { AudioLinkService } from '../../services/audio-link-service';
import { ClipboardService } from 'ngx-clipboard';
import { MockLogger } from '../../shared/testing/mock-logger';
import { GetAudioLinkButtonComponent } from './get-audio-link-button.component';
import { AudioLinkState } from '../../services/audio-link-state';
import { fakeAsync, tick } from '@angular/core/testing';
import { HearingAudioRecordingResponse } from 'src/app/services/clients/api-client';

describe('GetAudioLinkButtonComponent', () => {
    let audioLinkService: jasmine.SpyObj<AudioLinkService>;
    let clipboardService: jasmine.SpyObj<ClipboardService>;

    let component: GetAudioLinkButtonComponent;

    beforeEach(() => {
        audioLinkService = jasmine.createSpyObj<AudioLinkService>('AudioLinkService', ['getAudioLink']);
        clipboardService = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);

        component = new GetAudioLinkButtonComponent(audioLinkService, clipboardService, new MockLogger());
    });

    it('should get audio link and set state to finished', fakeAsync(async () => {
        audioLinkService.getAudioLink.and.returnValue(Promise.resolve(new HearingAudioRecordingResponse({ audio_file_links: ['myLink'] })));

        await component.onGetLinkClick();
        tick(3001);
        expect(component.showOnState(AudioLinkState.finished)).toBeTruthy();
    }));

    it('should fail in getting audio link and set state to error', fakeAsync(async () => {
        audioLinkService.getAudioLink.and.throwError('error');

        await component.onGetLinkClick();
        tick(3001);
        expect(component.showOnState(AudioLinkState.error)).toBeTruthy();
    }));

    it('should copy audio link and copied link message', fakeAsync(async () => {
        audioLinkService.getAudioLink.and.returnValue(Promise.resolve(new HearingAudioRecordingResponse({ audio_file_links: ['myLink'] })));

        await component.onGetLinkClick();
        await component.onCopyLinkClick(0);

        expect(component.showLinkCopiedMessage).toBeTruthy();
        expect(component.showLinkCopiedMessage[0]).toBeTruthy();
        tick(3001);
        expect(component.showOnState(AudioLinkState.finished)).toBeTruthy();
        expect(component.showLinkCopiedMessage).toBeTruthy();
        expect(component.showLinkCopiedMessage[0]).toBeFalsy();
    }));

    it('should get audio multi links and set state to finised for selected link', fakeAsync(async () => {
        audioLinkService.getAudioLink.and.returnValue(
            Promise.resolve(new HearingAudioRecordingResponse({ audio_file_links: ['myLink', 'myLink2'] }))
        );

        await component.onGetLinkClick();
        await component.onCopyLinkClick(0);

        tick(3001);
        expect(component.showOnState(AudioLinkState.finished)).toBeTruthy();
        expect(component.showLinkCopiedMessage.length).toBe(2);
        expect(component.showLinkCopiedMessage[0]).toBe(false);
        expect(component.showLinkCopiedMessage[1]).toBe(false);
    }));
    it('should not get audio files link and set state to initial', fakeAsync(async () => {
        audioLinkService.getAudioLink.and.returnValue(Promise.resolve(new HearingAudioRecordingResponse({ audio_file_links: [] })));

        await component.onGetLinkClick();

        tick(3001);
        expect(component.showOnState(AudioLinkState.error)).toBeTruthy();
        expect(component.showLinkCopiedMessage.length).toBe(0);
    }));
});
