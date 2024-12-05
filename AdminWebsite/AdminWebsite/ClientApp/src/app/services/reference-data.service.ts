import { Injectable } from '@angular/core';
import { AvailableLanguageResponse, BHClient, HearingTypeResponse, HearingVenueResponse } from './clients/api-client';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReferenceDataService {
    private interpreterLanguages$: Observable<AvailableLanguageResponse[]>;
    private courts$: Observable<HearingVenueResponse[]>;
    private hearingTypes$: Observable<HearingTypeResponse[]>;

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

    getHearingTypes(): Observable<HearingTypeResponse[]> {
        if (!this.hearingTypes$) {
            this.hearingTypes$ = this.bhClient.getHearingTypes().pipe(shareReplay(1));
        }
        return this.hearingTypes$;
    }
}
