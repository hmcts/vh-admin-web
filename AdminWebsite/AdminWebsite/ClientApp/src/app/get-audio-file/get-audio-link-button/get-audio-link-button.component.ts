import { Component, Input } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { AudioLinkService } from '../../services/audio-link-service';
import { AudioLinkState } from '../../services/audio-link-state';
import { Logger } from '../../services/logger';

@Component({
    selector: 'app-get-audio-link-button',
    templateUrl: './get-audio-link-button.component.html',
    styleUrls: ['./get-audio-link-button.component.scss']
})
export class GetAudioLinkButtonComponent {
    private readonly loggerPrefix = '[GetAudioLinkButton] -';
    public audioLinkStates: typeof AudioLinkState = AudioLinkState;
    private _currentLinkRetrievalState: AudioLinkState = AudioLinkState.initial;
    public showLinkCopiedMessage: boolean[] = [];

    showErrorMessage = false;

    audioLinks: string[];

    @Input() hearingId: string;

    constructor(private audioLinkService: AudioLinkService, private clipboardService: ClipboardService, private logger: Logger) {}

    getAudioLinks() {
        return this.audioLinks;
    }

    async onGetLinkClick() {
        this.logger.debug(`${this.loggerPrefix} Clicked on get audio link button`, { hearing: this.hearingId });
        try {
            this.setCurrentState(AudioLinkState.loading);
            this.audioLinks = (await this.audioLinkService.getAudioLink(this.hearingId)).audio_file_links;

            if (this.audioLinks.length === 0) {
                this.logger.warn(`${this.loggerPrefix} Hearing has no audio links: ${this.hearingId}`, {
                    hearing: this.hearingId
                });
                this.errorToGetLink();
            } else {
                this.showLinkCopiedMessage = [];
                this.audioLinks.forEach(x => {
                    this.showLinkCopiedMessage.push(false);
                });
                this.setCurrentState(AudioLinkState.finished);
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Error retrieving audio link for: ${this.hearingId}`, error, {
                hearing: this.hearingId
            });
            this.errorToGetLink();
        }
    }

    private errorToGetLink() {
        this.setCurrentState(AudioLinkState.error);
        this.showErrorMessage = true;
        setTimeout(() => this.hideErrorMessage(), 3000);
    }

    async onCopyLinkClick(fileIndex: number) {
        this.logger.debug(`${this.loggerPrefix} Copy link clicked`, { hearing: this.hearingId });
        this.clipboardService.copyFromContent(this.audioLinks[fileIndex]);
        this.showLinkCopiedMessage[fileIndex] = true;
        setTimeout(() => this.hideLinkCopiedMessage(fileIndex), 3000);
    }

    showOnState(audioLinkState: AudioLinkState) {
        return audioLinkState === this._currentLinkRetrievalState;
    }

    setCurrentState(audioLinkState: AudioLinkState) {
        this.logger.info(`${this.loggerPrefix} Updating retrieval state`, { hearing: this.hearingId, newState: audioLinkState });
        this._currentLinkRetrievalState = audioLinkState;
    }

    hideLinkCopiedMessage(fileIndex: number) {
        this.logger.debug(`${this.loggerPrefix} Hiding link copied message`, { hearing: this.hearingId });
        this.showLinkCopiedMessage[fileIndex] = false;
    }

    hideErrorMessage() {
        this.logger.debug(`${this.loggerPrefix} Hiding error message`, { hearing: this.hearingId });
        this.showErrorMessage = false;
    }
}
