import { Injectable } from '@angular/core';
import { BHClient } from './clients/api-client';
import { shareReplay } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VersionService {
    constructor(private readonly bhClient: BHClient) {
        this.version$ = this.bhClient.getAppVersion()?.pipe(shareReplay(1));
    }

    version$;
}
