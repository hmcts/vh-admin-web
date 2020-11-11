import { Injectable } from '@angular/core';
import { BHClient, UpdateUserPasswordResponse } from 'src/app/services/clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserDataService {
    constructor(private bhClient: BHClient) {}

    updateUser(userName: string): Observable<UpdateUserPasswordResponse> {
        return this.bhClient.updateUser(userName);
    }
}
