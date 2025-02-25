import { computed, inject, Injectable } from '@angular/core';
import { BHClient } from './clients/api-client';
import { shareReplay } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root'
})
export class VersionService {
    private bhClient = inject(BHClient);

    private readonly version$ = this.bhClient.getAppVersion().pipe(shareReplay(1));

    private versionResult = toSignal(this.version$, { initialValue: undefined });

    appVersion = computed(() => (this.versionResult() ? this.versionResult().app_version : 'Unknown'));
}
