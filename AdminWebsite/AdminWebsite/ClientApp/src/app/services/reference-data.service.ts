import { Injectable } from '@angular/core';
import { BHClient, HearingVenueResponse, PublicHolidayResponse } from './clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReferenceDataService {
    private publicHolidays: PublicHolidayResponse[];
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
}
