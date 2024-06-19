import { Injectable } from '@angular/core';
import { AvailableLanguageResponse, BHClient, HearingVenueResponse, PublicHolidayResponse } from './clients/api-client';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReferenceDataService {
    private publicHolidays: PublicHolidayResponse[];
    private interpreterLanguages$: Observable<AvailableLanguageResponse[]>;
    constructor(private bhClient: BHClient) {}

    getCourts(): Observable<HearingVenueResponse[]> {
        return this.bhClient.getCourts();
    }

    fetchPublicHolidays(): void {
        this.bhClient.publicHolidays().subscribe({
            next: pb => (this.publicHolidays = pb)
        });
    }

    getPublicHolidays(): PublicHolidayResponse[] {
        return this.publicHolidays;
    }

    getAvailableInterpreterLanguages(): Observable<AvailableLanguageResponse[]> {
        if (!this.interpreterLanguages$) {
            this.interpreterLanguages$ = this.bhClient.getAvailableLanguages().pipe(shareReplay(1));
        }
        return this.interpreterLanguages$;
    }
}
