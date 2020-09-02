import { Injectable } from '@angular/core';
import { BHClient, HearingsByUsernameForDeletionResponse } from './clients/api-client';
import { Logger } from './logger';

@Injectable({ providedIn: 'root' })
export class ParticipantDeleteServiceService {
    constructor(private bhClient: BHClient) {}

    async getHearingsForUsername(username: string): Promise<HearingsByUsernameForDeletionResponse[]> {
        try {
            return await this.bhClient.getHearingsByUsernameForDeletion(username).toPromise();
        } catch {
            return null;
        }
    }
}
