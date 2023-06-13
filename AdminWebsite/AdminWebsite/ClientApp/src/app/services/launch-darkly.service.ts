import { Injectable, OnDestroy } from '@angular/core';
import { LDFlagValue, LDClient, LDContext, initialize } from 'launchdarkly-js-client-sdk';
import { ConfigService } from './config.service';
import { Observable, Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';

export const FeatureFlags = {
    adminSearch: 'admin_search',
    vhoWorkAllocation: 'vho-work-allocation',
    eJudFeature: 'EJudFeature',
    dom1Integration: 'dom1',
    hrsIntegration: 'hrs-integration'
};

@Injectable({
    providedIn: 'root'
})
export class LaunchDarklyService implements OnDestroy {
    client: LDClient;

    constructor(private configService: ConfigService) {
        this.initialize();
    }

    async ngOnDestroy() {
        await this.client.close();
    }

    initialize(): void {
        this.configService
            .getClientSettings()
            .pipe(first())
            .subscribe(config => {
                const ldClientId = config.launch_darkly_client_id;
                const envName = config.redirect_uri;

                const context: LDContext = {
                    kind: 'user',
                    key: 'VideoWeb',
                    name: envName
                };

                this.client = initialize(ldClientId, context);
            });
    }

    getFlag<T>(flagKey: string, defaultValue: LDFlagValue = false): Observable<T> {
        const fetchFlag = new Subject<void>();
        this.client.on(`change:${flagKey}`, () => {
            fetchFlag.next();
        });
        this.client.waitUntilReady().then(() => {
            fetchFlag.next();
        });
        return fetchFlag.pipe(map(() => this.client.variation(flagKey, defaultValue) as T));
    }
}
