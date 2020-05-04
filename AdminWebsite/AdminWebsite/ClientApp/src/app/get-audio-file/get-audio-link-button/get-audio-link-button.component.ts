import { Component, Input } from '@angular/core';
import { AudioLinkService } from '../../services/audio-link-service';
import { AudioLinkState } from '../../services/audio-link-state';
import { Logger } from '../../services/logger';

@Component({
    selector: 'app-get-audio-link-button',
    templateUrl: './get-audio-link-button.component.html',
    styleUrls: ['./get-audio-link-button.component.scss']
})
export class GetAudioLinkButtonComponent {
    public audioLinkStates: typeof AudioLinkState = AudioLinkState;
    private _currentLinkRetrievalState: AudioLinkState = AudioLinkState.finished;

    @Input() hearingId: string;

    constructor(private audioLinkService: AudioLinkService, private logger: Logger) {}

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
        // do pop up
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
