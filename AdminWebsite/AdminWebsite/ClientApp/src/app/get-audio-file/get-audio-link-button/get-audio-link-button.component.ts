import { Component, Input } from '@angular/core';
import { AudioLinkService } from '../../services/audio-link-service';
import { AudioLinkState } from '../../services/audio-link-state';
import { Logger } from '../../services/logger';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-get-audio-link-button',
    templateUrl: './get-audio-link-button.component.html',
    styleUrls: ['./get-audio-link-button.component.scss']
})
export class GetAudioLinkButtonComponent {
    public audioLinkStates: typeof AudioLinkState = AudioLinkState;
    private _currentLinkRetrievalState: AudioLinkState = AudioLinkState.finished;

    @Input() hearingId: string;
    linkCopiedToClipboard: boolean;

    constructor(private audioLinkService: AudioLinkService, private toastrService: ToastrService, private logger: Logger) {
        this.linkCopiedToClipboard = false;
    }

    async onGetLinkClick() {
        try {
            this.setCurrentState(AudioLinkState.loading);

            const audioLink = await this.audioLinkService.getAudioLink('sdfs');

            this.setCurrentState(AudioLinkState.finished);
        } catch (error) {
            this.logger.error(`Error retrieving audio link for: ${this.hearingId}`, error);
            this.setCurrentState(AudioLinkState.error);
        }
    }

    async onCopyLinkClick() {
        // this.toastrService.error('Please try again!', 'We could not get the link', { positionClass: 'toast-center-center' });
        this.toastrService.info('', 'Link to audio file copied to clipboard', {
            positionClass: 'toast-center-center',
            timeOut: 999999
        });
        this.linkCopiedToClipboard = true;
    }

    showOnState(audioLinkState: AudioLinkState) {
        return audioLinkState === this._currentLinkRetrievalState;
    }

    get currentLinkRetrievalState() {
        return this._currentLinkRetrievalState;
    }

    setCurrentState(audioLinkState: AudioLinkState) {
        this._currentLinkRetrievalState = audioLinkState;
    }
}
