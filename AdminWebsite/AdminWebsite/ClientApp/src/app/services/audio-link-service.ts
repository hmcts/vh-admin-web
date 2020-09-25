import { Injectable } from '@angular/core';
import { BHClient, HearingsForAudioFileSearchResponse, CvpForAudioFileResponse } from './clients/api-client';
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

    async getAudioLink(hearingId: string): Promise<string[]> {
        const response = await this.bhClient.getAudioRecordingLink(hearingId).toPromise();
        return response.audio_file_links;
    }

    async getCvpAudioLinkWithCaseReference(cloudroomName: string, date: string, caseReference: string): Promise<CvpForAudioFileResponse[]> {
        try {
            return await this.bhClient.getCvpAudioRecordingLinkWithCaseReference(cloudroomName, date, caseReference).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving cvp audio file link for: ${cloudroomName}, ${date}, ${caseReference}`, error);
            return null;
        }
    }

    async getCvpAudioLink(cloudroomName: string, date: string): Promise<CvpForAudioFileResponse[]> {
        try {
            return await this.bhClient.getCvpAudioRecordingLink(cloudroomName, date).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving cvp audio file link for: ${cloudroomName}, ${date}`, error);
            return null;
        }
    }
}
