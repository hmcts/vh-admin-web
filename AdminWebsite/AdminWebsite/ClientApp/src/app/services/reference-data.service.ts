import { Injectable } from '@angular/core';
import {BHClient, HearingVenueResponse} from './clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReferenceDataService {

    constructor(private bhClient: BHClient) { }

    getCourts(): Observable<HearingVenueResponse[]> {
        return this.bhClient.getCourts();
    }
}
