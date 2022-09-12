import { Injectable } from '@angular/core';
import { BHClient, UserProfileResponse } from '../services/clients/api-client';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from '../common/constants';

@Injectable({
    providedIn: 'root'
})
export class UserIdentityService {
    constructor(private bhClient: BHClient) {}

    getUserInformation(): Observable<UserProfileResponse> {
        const userProfile = JSON.parse(sessionStorage.getItem(Constants.SessionStorageKeys.userProfile));

        if (userProfile) {
            return of(userProfile);
        }

        const userProfileResponse = this.bhClient.getUserProfile().pipe(
            map(userProfileFromApi => {
                sessionStorage.setItem(Constants.SessionStorageKeys.userProfile, JSON.stringify(userProfileFromApi));
                return userProfileFromApi;
            })
        );

        return userProfileResponse;
    }
}
