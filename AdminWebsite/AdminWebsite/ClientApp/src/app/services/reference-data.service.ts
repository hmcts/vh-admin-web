import { Injectable } from '@angular/core';
import { BHClient, CourtResponse } from '../services/clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReferenceDataService {

    constructor(private bhClient: BHClient) { }

    getCourts(): Observable<CourtResponse[]> {
        return this.bhClient.getCourts();
    }
}
