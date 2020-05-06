import { AudioLinkService } from '../../services/audio-link-service';
import { ClipboardService } from 'ngx-clipboard';
import { MockLogger } from '../../shared/testing/mock-logger';
import { GetAudioLinkButtonComponent } from './get-audio-link-button.component';
import { AudioLinkState } from '../../services/audio-link-state';
import { fakeAsync, tick } from '@angular/core/testing';

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
        audioLinkService.getAudioLink.and.returnValue(Promise.resolve('myLink'));

        await component.onGetLinkClick();
        tick(2001);
        expect(component.showOnState(AudioLinkState.finished)).toBeTruthy();
    }));

    it('should fail in getting audio link and set state to error', async () => {
        audioLinkService.getAudioLink.and.throwError('error');

        await component.onGetLinkClick();
        expect(component.showOnState(AudioLinkState.error)).toBeTruthy();
    });

    it('should copy audio link and copied link message', fakeAsync(async () => {
        audioLinkService.getAudioLink.and.returnValue(Promise.resolve('myLink'));

        await component.onGetLinkClick();
        await component.onCopyLinkClick();
        expect(component.showLinkCopiedMessage).toBeTruthy();
        tick(2001);
        expect(component.showOnState(AudioLinkState.finished)).toBeTruthy();
        expect(component.showLinkCopiedMessage).toBeFalsy();
    }));
});
