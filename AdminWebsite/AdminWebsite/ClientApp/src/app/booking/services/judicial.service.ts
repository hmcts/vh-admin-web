import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BHClient, JudiciaryPersonResponse } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class JudicialService {
    constructor(private bhClient: BHClient) {}

    getJudicialUsers(searchText: string): Observable<JudiciaryPersonResponse[]> {
        return this.bhClient.searchForJudiciaryPerson(searchText);
    }
}
