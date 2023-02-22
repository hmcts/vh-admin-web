import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { AddJusticeUserRequest, BHClient, JusticeUserResponse, JusticeUserRole } from './clients/api-client';
import { cleanQuery } from '../common/helpers/api-helper';

@Injectable({
    providedIn: 'root'
})
export class JusticeUsersService {
    private cache$: Observable<JusticeUserResponse[]>;

    constructor(private apiClient: BHClient) {}
    retrieveJusticeUserAccounts() {
        if (!this.cache$) {
            this.cache$ = this.requestJusticeUsers(null).pipe(shareReplay(1));
        }

        return this.cache$;
    }

    retrieveJusticeUserAccountsNoCache(term: string) {
        return this.requestJusticeUsers(term).pipe(shareReplay(1));
    }

    private requestJusticeUsers(term: string) {
        return this.apiClient.getUserList(cleanQuery(term));
    }

    checkIfUserExistsByUsername(username: string) {
        return this.apiClient.checkJusticeUserExists(username);
    }

    addNewJusticeUser(
        username: string,
        firstName: string,
        lastName: string,
        contactEmail: string,
        telephone: string,
        role: JusticeUserRole
    ) {
        const request = new AddJusticeUserRequest({
            username: username,
            first_name: firstName,
            last_name: lastName,
            contact_email: contactEmail,
            telephone: telephone,
            role: role
        });
        return this.apiClient.addNewJusticeUser(request);
    }
}
