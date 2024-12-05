import { Injectable } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
    AddNewJusticeUserRequest,
    BHClient,
    EditJusticeUserRequest,
    JusticeUserResponse,
    JusticeUserRole,
    RestoreJusticeUserRequest
} from './clients/api-client';
import { cleanQuery } from '../common/helpers/api-helper';
import { Logger } from './logger';

@Injectable({
    providedIn: 'root'
})
export class JusticeUsersService {
    loggerPrefix = '[JusticeUsersService] -';
    private readonly refresh$: BehaviorSubject<void> = new BehaviorSubject(null);
    private readonly searchTerm$: BehaviorSubject<string> = new BehaviorSubject(null);

    allUsers$ = this.refresh$.pipe(
        mergeMap(() => this.getJusticeUsers(null)),
        shareReplay(1)
    );

    filteredUsers$ = this.allUsers$.pipe(
        switchMap(users =>
            this.searchTerm$.pipe(
                filter(searchTerm => searchTerm !== null),
                map(term => this.applyFilter(term, users))
            )
        )
    );

    constructor(private readonly apiClient: BHClient, private readonly logger: Logger) {}

    refresh() {
        this.refresh$.next();
    }

    clearUsers() {
        this.searchTerm$.next('');
    }

    search(searchTerm: string) {
        this.searchTerm$.next(searchTerm);
    }

    applyFilter(searchTerm: string, users: JusticeUserResponse[]): JusticeUserResponse[] {
        // Clear all users
        if (searchTerm === '') {
            return [];
        }

        if (!searchTerm) {
            return users;
        }

        return users.filter(user =>
            [user.first_name, user.lastname, user.contact_email, user.username].some(field =>
                field.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }

    addNewJusticeUser(username: string, firstName: string, lastName: string, telephone: string, roles: JusticeUserRole[]) {
        const request = new AddNewJusticeUserRequest({
            username: username,
            first_name: firstName,
            last_name: lastName,
            contact_telephone: telephone,
            roles: roles
        });
        return this.apiClient.addNewJusticeUser(request).pipe(tap(() => this.refresh$.next()));
    }

    editJusticeUser(id: string, username: string, firstName: string, lastName: string, telephone: string, roles: JusticeUserRole[]) {
        const request = new EditJusticeUserRequest({
            id,
            username,
            first_name: firstName,
            last_name: lastName,
            contact_telephone: telephone,
            roles
        });
        return this.apiClient.editJusticeUser(request).pipe(tap(() => this.refresh$.next()));
    }

    deleteJusticeUser(id: string) {
        return this.apiClient.deleteJusticeUser(id).pipe(tap(() => this.refresh$.next()));
    }

    restoreJusticeUser(id: string, username: string) {
        const request = new RestoreJusticeUserRequest({
            username,
            id
        });
        return this.apiClient.restoreJusticeUser(request).pipe(tap(() => this.refresh$.next()));
    }

    private getJusticeUsers(term: string) {
        return this.apiClient.getUserList(cleanQuery(term)).pipe(
            catchError(error => {
                this.logger.error(`${this.loggerPrefix} There was an unexpected error getting justice users`, new Error(error));
                return throwError(() => error);
            })
        );
    }
}
