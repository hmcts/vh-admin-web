import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BHClient, JudiciaryPerson } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class JudicialService {
    constructor(private readonly bhClient: BHClient) {}

    getJudicialUsers(searchText: string): Observable<JudiciaryPerson[]> {
        return this.bhClient.searchForJudiciaryPerson(searchText);
    }
}
