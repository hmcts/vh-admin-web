import { Injectable } from '@angular/core';
import { BHClient } from 'src/app/services/clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserDataService {
    constructor(private readonly bhClient: BHClient) {}

    updateUser(userName: string): Observable<void> {
        return this.bhClient.resetPassword(userName);
    }
}
