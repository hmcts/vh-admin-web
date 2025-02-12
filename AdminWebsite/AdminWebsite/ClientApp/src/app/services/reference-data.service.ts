import { Injectable } from '@angular/core';
import { AvailableLanguageResponse, BHClient, CaseTypeResponse, HearingVenueResponse } from './clients/api-client';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReferenceDataService {
    private interpreterLanguages$: Observable<AvailableLanguageResponse[]>;
    private courts$: Observable<HearingVenueResponse[]>;
    private caseTypes$: Observable<CaseTypeResponse[]>;

    constructor(private readonly bhClient: BHClient) {}

    getCourts(): Observable<HearingVenueResponse[]> {
        if (!this.courts$) {
            this.courts$ = this.bhClient.getCourts().pipe(shareReplay(1));
        }
        return this.courts$;
    }

    getAvailableInterpreterLanguages(): Observable<AvailableLanguageResponse[]> {
        if (!this.interpreterLanguages$) {
            this.interpreterLanguages$ = this.bhClient.getAvailableLanguages().pipe(shareReplay(1));
        }
        return this.interpreterLanguages$;
    }

    getCaseTypes(): Observable<CaseTypeResponse[]> {
        if (!this.caseTypes$) {
            this.caseTypes$ = this.bhClient.getCaseTypes().pipe(shareReplay(1));
        }
        return this.caseTypes$;
    }
}
