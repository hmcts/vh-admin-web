import { Injectable } from '@angular/core';
import { BHClient, HearingsByUsernameForDeletionResponse } from './clients/api-client';

@Injectable({ providedIn: 'root' })
export class ParticipantDeleteService {
    constructor(private bhClient: BHClient) {}

    async getHearingsForUsername(username: string): Promise<HearingsByUsernameForDeletionResponse[]> {
        try {
            return await this.bhClient.getHearingsByUsernameForDeletion(username).toPromise();
        } catch {
            return null;
        }
    }

    async deleteUserAccount(username: string): Promise<void> {
        await this.bhClient.deletePersonWithUsername(username).toPromise();
    }
}
