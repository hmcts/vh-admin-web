import { Injectable } from '@angular/core';
import { AllocationHearingsResponse, BHClient, UpdateHearingAllocationToCsoRequest } from './clients/api-client';
import { Logger } from './logger';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AllocateHearingsService {
    constructor(private bhClient: BHClient, private logger: Logger) {}

    getAllocationHearings(fromDate, toDate, csoUserName, caseType, caseNumber, isAllocated): Observable<AllocationHearingsResponse[]> {
        // remove empty query parameters from url by making them 'undefined', null will throw error.
        const cleanQuery = parameter => (parameter === null || parameter === '' ? undefined : parameter);

        try {
            return this.bhClient.getAllocationHearings(
                cleanQuery(fromDate),
                cleanQuery(toDate),
                cleanQuery(csoUserName),
                cleanQuery(caseType),
                cleanQuery(caseNumber),
                cleanQuery(isAllocated)
            );
        } catch (error) {
            this.logger.error(`${error.response}`, error);
            return new Observable<AllocationHearingsResponse[]>();
        }
    }

    setAllocationToHearings(selectedHearings: string[], csoUserId: string): Observable<AllocationHearingsResponse[]> {
        // try {
        const request = new UpdateHearingAllocationToCsoRequest();
        request.hearings = selectedHearings;
        request.cso_id = csoUserId;
        return this.bhClient.allocateHearingsToCso(request);
    }
}
