import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AddJusticeUserRequest, BHClient, EditJusticeUserRequest, JusticeUserResponse, JusticeUserRole } from './clients/api-client';
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
        return this.apiClient.getUserList(cleanQuery(term)).pipe(
            map(users =>
                users.map(user => {
                    const userRole = user.is_vh_team_leader ? 'Team Lead' : 'CSO';
                    user.user_role_name = userRole;
                    return user;
                })
            )
        );
    }

    addNewJusticeUser(username: string, firstName: string, lastName: string, telephone: string, role: JusticeUserRole) {
        const request = new AddJusticeUserRequest({
            username: username,
            first_name: firstName,
            last_name: lastName,
            telephone: telephone,
            role: role
        });
        return this.apiClient.addNewJusticeUser(request);
    }

    editJusticeUser(id: string, username: string, role: JusticeUserRole) {
        const request = new EditJusticeUserRequest({
            id,
            username,
            role
        });
        return this.apiClient.editJusticeUser(request);
    }

    deleteJusticeUser(id: string) {
        return this.apiClient.deleteJusticeUser(id);
    }
}
