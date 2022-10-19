import { Injectable } from '@angular/core';
import { BHClient } from './clients/api-client';
import { Logger } from './logger';

@Injectable({
    providedIn: 'root'
})
export class EditWorkHoursService {
    constructor(private bhClient: BHClient, private logger: Logger) {}

    async searchForVho(username: string) {
        try {
            return await this.bhClient.getWorkAvailabilityHours(username).toPromise();
        } catch (error) {
            if (error.status === 404 || error.status === 400) {
                this.logger.warn(`Failed to find user ${username}. ${error.response}`, error);
                return null;
            }
            this.logger.error(`Failed to find user ${username}. ${error.response}`, error);
            throw error;
        }
    }
}
