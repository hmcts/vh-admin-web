import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BHClient } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
@Injectable({
    providedIn: 'root'
})
export class EditWorkHoursService {
    fetchNonWorkHours$ = new Subject<boolean>();

    constructor(private bhClient: BHClient, private logger: Logger) {}

    async getWorkAvailabilityForVho(username: string) {
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

    async getNonWorkAvailabilityForVho(username: string) {
        try {
            return await this.bhClient.getNonAvailabilityWorkHours(username).toPromise();
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
