import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, mergeMap, share, shareReplay, switchMap, tap } from 'rxjs/operators';
import { AddJusticeUserRequest, BHClient, EditJusticeUserRequest, JusticeUserResponse, JusticeUserRole } from './clients/api-client';
import { cleanQuery } from '../common/helpers/api-helper';

@Injectable({
    providedIn: 'root'
})
export class JusticeUsersService {
    private cache$: Observable<JusticeUserResponse[]>;
    private refresh$: BehaviorSubject<void> = new BehaviorSubject(null);
    private searchTerm$: BehaviorSubject<string> = new BehaviorSubject(null);

    users$ = this.refresh$.pipe(
        mergeMap(() => this.requestJusticeUsers(null)),
        shareReplay(1),
        switchMap(users =>
            this.searchTerm$.pipe(
                map(term => {
                    return this.applyFilter(term, users);
                })
            )
        ),
        tap(x => console.log(`Search results`, x))
    );

    constructor(private apiClient: BHClient) {}

    // just for testing -- remove
    // triggers an emission on users$
    refresh() {
        this.refresh$.next();
    }

    // push a search term into the stream
    search(searchTerm: string) {
        console.log(`Searching with ${searchTerm}`);
        this.searchTerm$.next(searchTerm);
    }

    // more complex searching required here
    applyFilter(searchTerm: string, users: JusticeUserResponse[]): JusticeUserResponse[] {
        if (!searchTerm) {
            return users;
        }
        return users.filter(user => user.first_name === searchTerm);
    }

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
        return this.apiClient.addNewJusticeUser(request).pipe(tap(() => this.refresh$.next()));
    }

    editJusticeUser(id: string, username: string, role: JusticeUserRole) {
        const request = new EditJusticeUserRequest({
            id,
            username,
            role
        });
        return this.apiClient.editJusticeUser(request).pipe(tap(() => this.refresh$.next()));
    }
}
