import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { BHClient, JusticeUserResponse } from './clients/api-client';
import { cleanQuery } from '../common/helpers/api-helper';

@Injectable({
    providedIn: 'root'
})
export class JusticeUsersService {
    private cache$: Observable<JusticeUserResponse[]>;

    constructor(private apiClient: BHClient) {}

    retrieveJusticeUserAccounts(term: string) {
        if (!this.cache$) {
            this.cache$ = this.requestJusticeUsers(cleanQuery(term)).pipe(shareReplay(1));
        }

        return this.cache$;
    }

    private requestJusticeUsers(term: string) {
        return this.apiClient.getUserList(term);
    }
}
