import { Injectable } from '@angular/core';
import { BHClient, HearingsByCaseNumberResponse } from './clients/api-client';
import { Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class AudioLinkService {
    private _currentLinkRetrievalState: AudioLinkState = AudioLinkState.initial;

    constructor(private bhClient: BHClient, private logger: Logger) {}

    async getHearingByCaseNumber(caseNumber: string): Promise<HearingsByCaseNumberResponse[]> {
        try {
            return await this.bhClient.getHearingsByCaseNumber(caseNumber).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving hearing for: ${caseNumber}`, error);
        }
    }

    async getAudioLink(hearingId: string): Promise<string> {
        try {
            this._currentLinkRetrievalState = AudioLinkState.loading;
            const response = await this.bhClient.getHearingsByCaseNumber(hearingId).toPromise();

            return 'http://myLink.com/sjdfusdhfishdfhs';
        } catch (error) {
            this.logger.error(`Error retrieving audio link for: ${hearingId}`, error);
            this._currentLinkRetrievalState = AudioLinkState.error;
        }
    }

    get currentLinkRetrievalState() {
        return this._currentLinkRetrievalState;
    }
}

export enum AudioLinkState {
    initial, // no get link has been requested
    loading, // getting link from server
    ready, // link has been retrieved
    finished, // have the link in a local variable
    error // we are in an error state
}
