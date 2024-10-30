import { Injectable } from '@angular/core';
import { AvailableLanguageResponse, BHClient, HearingVenueResponse } from './clients/api-client';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReferenceDataService {
    private interpreterLanguages$: Observable<AvailableLanguageResponse[]>;
    constructor(private readonly bhClient: BHClient) {}

    getCourts(): Observable<HearingVenueResponse[]> {
        return this.bhClient.getCourts();
    }

    getAvailableInterpreterLanguages(): Observable<AvailableLanguageResponse[]> {
        if (!this.interpreterLanguages$) {
            this.interpreterLanguages$ = this.bhClient.getAvailableLanguages().pipe(shareReplay(1));
        }
        return this.interpreterLanguages$;
    }
}
