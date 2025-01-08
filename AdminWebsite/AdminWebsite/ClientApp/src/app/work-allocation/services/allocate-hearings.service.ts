import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AllocationHearingsResponse, BHClient, UpdateHearingAllocationToCsoRequest } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { cleanQuery } from '../../common/helpers/api-helper';

@Injectable({
    providedIn: 'root'
})
export class AllocateHearingsService {
    constructor(
        private readonly bhClient: BHClient,
        private readonly logger: Logger
    ) {}

    getAllocationHearings(fromDate, toDate, csoUserName, caseType, caseNumber, isAllocated): Observable<AllocationHearingsResponse[]> {
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

    allocateCsoToHearings(selectedHearings: string[], csoUserId: string): Observable<AllocationHearingsResponse[]> {
        const request = new UpdateHearingAllocationToCsoRequest();
        request.hearings = selectedHearings;
        request.cso_id = csoUserId;
        return this.bhClient.allocateHearingsToCso(request);
    }
}
