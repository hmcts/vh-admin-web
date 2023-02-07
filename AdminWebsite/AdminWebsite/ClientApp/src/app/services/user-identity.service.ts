import { Injectable } from '@angular/core';
import { BHClient, UserProfileResponse } from '../services/clients/api-client';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UserIdentityService {
    profile: UserProfileResponse;

    constructor(private bhClient: BHClient) {}

    getUserInformation(): Observable<UserProfileResponse> {
        if (this.profile) {
            return of(this.profile);
        }

        const userProfileResponse = this.bhClient.getUserProfile().pipe(
            map(userProfileFromApi => {
                this.profile = userProfileFromApi;
                return this.profile;
            })
        );

        return userProfileResponse;
    }

    clearUserProfile(): void {
        this.profile = null;
    }
}
