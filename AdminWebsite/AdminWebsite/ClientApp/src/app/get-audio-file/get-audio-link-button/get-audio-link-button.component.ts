import { Component } from '@angular/core';
import { AudioLinkService, AudioLinkState } from '../../services/audio-link-service';

@Component({
    selector: 'app-get-audio-link-button',
    templateUrl: './get-audio-link-button.component.html',
    styleUrls: ['./get-audio-link-button.component.scss']
})
export class GetAudioLinkButtonComponent {
    buttonText: string;

    constructor(private audioLinkService: AudioLinkService) {
        this.buttonText = audioLinkService.currentLinkRetrievalState.toString();
    }

    async onGetLinkClick() {
        const audioLink = await this.audioLinkService.getAudioLink('sdfs');
        this.buttonText = audioLink;
    }

    async onCopyLinkClick() {
        // do pop up
    }

    showOnState(audioLinkState: AudioLinkState) {
        return this.audioLinkService.currentLinkRetrievalState;
    }
}
