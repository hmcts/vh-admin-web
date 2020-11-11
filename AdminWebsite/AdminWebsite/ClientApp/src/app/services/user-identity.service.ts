import { Injectable } from '@angular/core';
import { BHClient, UserProfileResponse } from '../services/clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserIdentityService {
    constructor(private bhClient: BHClient) {}

    getUserInformation(): Observable<UserProfileResponse> {
        return this.bhClient.getUserProfile();
    }
}
