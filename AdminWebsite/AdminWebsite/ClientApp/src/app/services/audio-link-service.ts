import { Injectable } from '@angular/core';
import { BHClient, HearingsForAudioFileSearchResponse, CvpAudioFileResponse } from './clients/api-client';
import { Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class AudioLinkService {
    constructor(private bhClient: BHClient, private logger: Logger) {}

    async getHearingsByCaseNumber(caseNumber: string): Promise<HearingsForAudioFileSearchResponse[]> {
        try {
            return await this.bhClient.getHearingsByCaseNumber(caseNumber).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving hearing for: ${caseNumber}`, error);
            return null;
        }
    }

    async getAudioLink(hearingId: string): Promise<string> {
        const response = await this.bhClient.getAudioRecordingLink(hearingId).toPromise();

        return response.audio_file_link;
    }

    async getCvpAudioLink(cloudroomName: string, hearingDate: Date, caseReference: string = null): Promise<CvpAudioFileResponse[]> {
        const response = await this.bhClient.getCvpAudioRecordingLink(cloudroomName, hearingDate, caseReference).toPromise();

        return response;
    }
}
