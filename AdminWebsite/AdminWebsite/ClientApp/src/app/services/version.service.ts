import { Injectable } from '@angular/core';
import { AppVersionResponse, BHClient } from './clients/api-client';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VersionService {
    constructor(private readonly bhClient: BHClient) {
        this.version$ = this.bhClient.getAppVersion()?.pipe(shareReplay(1));
    }

    version$: Observable<AppVersionResponse>;
}
