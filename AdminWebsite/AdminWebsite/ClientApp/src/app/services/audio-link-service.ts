import { Injectable } from '@angular/core';
import { BHClient, CvpForAudioFileResponse, HearingsForAudioFileSearchResponse } from './clients/api-client';
import { Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class AudioLinkService {
    constructor(private bhClient: BHClient, private logger: Logger) {}

    async searchForHearingsByCaseNumberOrDate(caseNumber: string, date?: Date): Promise<HearingsForAudioFileSearchResponse[]> {
        try {
            return await this.bhClient.searchForAudioRecordedHearings(caseNumber, date).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving hearing for: ${caseNumber}`, error);
            return null;
        }
    }

    async getAudioLink(hearingId: string): Promise<string[]> {
        const response = await this.bhClient.getAudioRecordingLink(hearingId).toPromise();
        return response.audio_file_links;
    }

    async getCvpAudioRecordingsAll(cloudRoomName: string, date: string, caseReference: string): Promise<CvpForAudioFileResponse[]> {
        try {
            return await this.bhClient.getCvpAudioRecordingsAll(cloudRoomName, date, caseReference).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving cvp audio file link for: ${cloudRoomName}, ${date}, ${caseReference}`, error);
            return null;
        }
    }

    async getCvpAudioRecordingsByCloudRoom(cloudRoomName: string, date: string): Promise<CvpForAudioFileResponse[]> {
        try {
            return await this.bhClient.getCvpAudioRecordingsByCloudRoom(cloudRoomName, date).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving cvp audio file link for: ${cloudRoomName}, ${date}`, error);
            return null;
        }
    }

    async getCvpAudioRecordingsByDate(date: string, caseReference: string): Promise<CvpForAudioFileResponse[]> {
        try {
            return await this.bhClient.getCvpAudioRecordingsByDate(date, caseReference).toPromise();
        } catch (error) {
            this.logger.error(`Error retrieving cvp audio file link for Date: ${date}, ${caseReference}`, error);
            return null;
        }
    }
}
