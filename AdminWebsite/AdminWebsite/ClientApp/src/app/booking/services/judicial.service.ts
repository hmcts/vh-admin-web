import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { BHClient, JudiciaryPerson } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class JudicialService {
    constructor(private bhClient: BHClient) {}

    getJudicialUsers(searchText: string): Observable<JudiciaryPerson[]> {
        // for each item in the array we set the work_phone property to '01234567890'

        return this.bhClient.searchForJudiciaryPerson(searchText).pipe(
            map(items =>
                items.map(
                    item =>
                        ({
                            ...item,
                            work_phone: '01234567890'
                        } as JudiciaryPerson)
                )
            )
        );
    }
}
