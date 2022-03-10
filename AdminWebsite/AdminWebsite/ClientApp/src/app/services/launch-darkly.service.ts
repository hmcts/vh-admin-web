import { Injectable } from '@angular/core';
import * as LDClient from 'launchdarkly-js-client-sdk';
import { BehaviorSubject } from 'rxjs';
import { ConfigService } from './config.service';

export const FeatureFlags = {
    adminSearch: 'admin_search'
    // Add more ...
};

@Injectable({
    providedIn: 'root'
})
export class LaunchDarklyService {
    private flags: any;
    ldClient: LDClient.LDClient;
    flagChange = new BehaviorSubject(null);

    constructor(private config: ConfigService) {
        this.initialize();

        this.onReady();

        this.onChange();
    }

    initialize(): void {
        this.flags = {};
        const ldClientId = this.config.getConfig().launch_darkly_client_id;
        const user: LDClient.LDUser = { key: 'AdminWeb', anonymous: true };
        this.ldClient = LDClient.initialize(ldClientId, user);
    }

    onReady(): void {
        this.ldClient.on('ready', flags => {
            this.setAllFlags();
        });
    }

    onChange(): void {
        this.ldClient.on('change', flags => {
            for (const flag of Object.keys(flags)) {
                this.flags[flag] = flags[flag].current;
            }
            this.flagChange.next(this.flags);
            console.log('Flags updated', this.flags);
        });
    }

    private setAllFlags(): void {
        this.flags = this.ldClient.allFlags();
        this.flagChange.next(this.flags);
        console.log('Flags initialized');
    }
}
