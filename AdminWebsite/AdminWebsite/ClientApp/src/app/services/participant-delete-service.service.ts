import { Injectable } from '@angular/core';
import { BHClient, HearingsByUsernameForDeletionResponse } from './clients/api-client';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ParticipantDeleteService {
    constructor(private bhClient: BHClient) {}

    async getHearingsForUsername(username: string): Promise<HearingsByUsernameForDeletionResponse[]> {
        try {
            return await lastValueFrom(this.bhClient.getHearingsByUsernameForDeletion(username));
        } catch {
            return null;
        }
    }

    async deleteUserAccount(username: string): Promise<void> {
        return await lastValueFrom(this.bhClient.deletePersonWithUsername(username));
    }
}
