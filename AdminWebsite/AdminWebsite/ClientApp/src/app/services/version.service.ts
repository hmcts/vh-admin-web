import { computed, inject, Injectable } from '@angular/core';
import { BHClient } from './clients/api-client';
import { shareReplay } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root'
})
export class VersionService {
    
    constructor(private bhClient: BHClient) {
        this.version$ = this.bhClient.getAppVersion().pipe(shareReplay(1));
        this.versionResult = toSignal(this.version$, { initialValue: undefined });
    }

    private version$;
    private versionResult;

    appVersion = computed(() => (this.versionResult() ? this.versionResult().app_version : 'Unknown'));
}
