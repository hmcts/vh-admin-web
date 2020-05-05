import { Component, Input } from '@angular/core';
import { AudioLinkService } from '../../services/audio-link-service';
import { AudioLinkState } from '../../services/audio-link-state';
import { Logger } from '../../services/logger';
import { ClipboardService } from 'ngx-clipboard';

@Component({
    selector: 'app-get-audio-link-button',
    templateUrl: './get-audio-link-button.component.html',
    styleUrls: ['./get-audio-link-button.component.scss']
})
export class GetAudioLinkButtonComponent {
    public audioLinkStates: typeof AudioLinkState = AudioLinkState;
    private _currentLinkRetrievalState: AudioLinkState = AudioLinkState.initial;
    public showLinkCopiedMessage = false;
    private audioLink: string;

    @Input() hearingId: string;

    constructor(private audioLinkService: AudioLinkService, private clipboardService: ClipboardService, private logger: Logger) {}

    async onGetLinkClick() {
        try {
            this.setCurrentState(AudioLinkState.loading);

            this.audioLink = await this.audioLinkService.getAudioLink(this.hearingId);

            this.setCurrentState(AudioLinkState.finished);
        } catch (error) {
            this.logger.error(`Error retrieving audio link for: ${this.hearingId}`, error);
            this.setCurrentState(AudioLinkState.error);
        }
    }

    async onCopyLinkClick() {
        this.clipboardService.copyFromContent(this.audioLink);
        this.showLinkCopiedMessage = true;
    }

    showOnState(audioLinkState: AudioLinkState) {
        return audioLinkState === this._currentLinkRetrievalState;
    }

    setCurrentState(audioLinkState: AudioLinkState) {
        this._currentLinkRetrievalState = audioLinkState;
    }

    hideLinkCopiedMessage() {
        this.showLinkCopiedMessage = false;
    }
}
