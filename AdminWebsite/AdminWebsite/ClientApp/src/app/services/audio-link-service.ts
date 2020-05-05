import { Injectable } from '@angular/core';
import { BHClient, HearingsForAudioFileSearchResponse } from './clients/api-client';
import { Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class AudioLinkService {
    constructor(private bhClient: BHClient, private logger: Logger) {}

    async getHearingByCaseNumber(caseNumber: string): Promise<HearingsForAudioFileSearchResponse[]> {
        try {
            return await this.bhClient.getHearingsByCaseNumber(caseNumber).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving hearing for: ${caseNumber}`, error);
        }
    }

    async getAudioLink(hearingId: string): Promise<string> {
        try {
            const response = await this.bhClient.getAudioRecordingLink(hearingId).toPromise();

            return response.audio_file_link;
        } catch (error) {
            this.logger.error(`Error retrieving audio recording link for: ${hearingId}`, error);
        }
    }
}
