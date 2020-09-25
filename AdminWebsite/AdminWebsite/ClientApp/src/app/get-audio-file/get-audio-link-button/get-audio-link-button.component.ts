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
    public showLinkCopiedMessage: boolean[] = [];

    showErrorMessage = false;

    audioLinks: string[] = [];

    @Input() hearingId: string;

    constructor(private audioLinkService: AudioLinkService, private clipboardService: ClipboardService, private logger: Logger) {}

    async onGetLinkClick() {
        try {
            this.setCurrentState(AudioLinkState.loading);

            this.audioLinks = await this.audioLinkService.getAudioLink(this.hearingId);
            if (this.audioLinks.length === 0) {
                this.errorToGetLink();
            } else {
                this.showLinkCopiedMessage = [];
                this.audioLinks.forEach(x => {
                    this.showLinkCopiedMessage.push(false);
                });
                setTimeout(() => this.setCurrentState(AudioLinkState.finished), 3000);
            }
        } catch (error) {
            this.errorToGetLink();
        }
    }

    private errorToGetLink() {
        this.logger.warn(`Error retrieving audio link for: ${this.hearingId}`);
        this.setCurrentState(AudioLinkState.error);
        this.showErrorMessage = true;
        setTimeout(() => this.hideErrorMessage(), 3000);
    }

    async onCopyLinkClick(fileIndex: number) {
        this.clipboardService.copyFromContent(this.audioLinks[fileIndex]);
        this.showLinkCopiedMessage[fileIndex] = true;
        setTimeout(() => this.hideLinkCopiedMessage(fileIndex), 3000);
    }

    showOnState(audioLinkState: AudioLinkState) {
        return audioLinkState === this._currentLinkRetrievalState;
    }

    setCurrentState(audioLinkState: AudioLinkState) {
        this._currentLinkRetrievalState = audioLinkState;
    }

    hideLinkCopiedMessage(fileIndex: number) {
        this.showLinkCopiedMessage[fileIndex] = false;
    }

    hideErrorMessage() {
        this.showErrorMessage = false;
    }
}
