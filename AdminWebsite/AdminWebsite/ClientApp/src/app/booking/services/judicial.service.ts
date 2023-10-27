import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BHClient, PersonResponse } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class JudicialService {
    constructor(private bhClient: BHClient) {}

    getJudicialUsers(searchText: string): Observable<PersonResponse[]> {
        return this.bhClient.searchForJudiciaryPerson(searchText);
    }
}
