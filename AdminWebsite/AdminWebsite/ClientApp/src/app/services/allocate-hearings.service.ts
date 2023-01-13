import { Injectable } from '@angular/core';
import { AllocationHearingsResponse, BHClient } from './clients/api-client';
import { Logger } from './logger';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AllocateHearingsService {
    constructor(private bhClient: BHClient, private logger: Logger) {}

    getAllocationHearings(fromDate, toDate, csoUserName, caseType, caseNumber): Observable<AllocationHearingsResponse[]> {
        try {
            return this.bhClient.getAllocationHearings(fromDate, toDate, csoUserName, caseType, caseNumber);
        } catch (error) {
            this.logger.error(`${error.response}`, error);
            return null;
        }
    }
}
