import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { BHClient, JusticeUserResponse } from './clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class JusticeUsersService {
    private cache$: Observable<JusticeUserResponse[]>;

    constructor(private apiClient: BHClient) {}

    retrieveJusticeUserAccounts() {
        if (!this.cache$) {
            this.cache$ = this.requestJusticeUsers().pipe(shareReplay(1));
        }

        return this.cache$;
    }

    private requestJusticeUsers() {
        return this.apiClient.getUserList();
    }
}
