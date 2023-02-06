import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AllocationHearingsResponse, BHClient } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { cleanQuery } from '../../common/helpers/api-helper';

@Injectable({
    providedIn: 'root'
})
export class AllocateHearingsService {
    constructor(private bhClient: BHClient, private logger: Logger) {}

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
}
