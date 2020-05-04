import { Injectable } from '@angular/core';
import { BHClient, HearingsByCaseNumberResponse } from './clients/api-client';
import { Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class AudioLinkService {
    constructor(private bhClient: BHClient, private logger: Logger) {}

    async getHearingByCaseNumber(caseNumber: string): Promise<HearingsByCaseNumberResponse[]> {
        try {
            return await this.bhClient.getHearingsByCaseNumber(caseNumber).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving hearing for: ${caseNumber}`, error);
        }
    }

    async getAudioLink(hearingId: string): Promise<string> {
        const response = await this.bhClient.getHearingsByCaseNumber(hearingId).toPromise();

        return 'http://myLink.com/sjdfusdhfishdfhs';
    }
}
