import { Injectable } from '@angular/core';
import { ClientSettingsResponse } from '../services/clients/api-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Config } from '../common/model/config';
import { filter, map } from 'rxjs/operators';
import { SessionStorage } from './session-storage';

export let ENVIRONMENT_CONFIG: Config = new Config();

@Injectable()
export class ConfigService {
    clientSettingsLoaded$ = new BehaviorSubject(false);
    private SETTINGS_KEY = 'vh.client.settings';
    private readonly clientSettingCache: SessionStorage<ClientSettingsResponse>;
    private httpClient: HttpClient;

    constructor(handler: HttpBackend) {
        this.httpClient = new HttpClient(handler);
        this.clientSettingCache = new SessionStorage<ClientSettingsResponse>(this.SETTINGS_KEY);
    }

    loadConfig() {
        if (this.getConfig()) {
            this.clientSettingsLoaded$.next(true);
            return;
        }

        try {
            this.retrieveConfigFromApi().subscribe(result => {
                this.clientSettingCache.set(result);
                this.clientSettingsLoaded$.next(true);
            });
        } catch (err) {
            console.error(`failed to read configuration: ${err}`);
            throw err;
        }
    }

    getClientSettings(): Observable<ClientSettingsResponse> {
        return this.clientSettingsLoaded$.pipe(
            filter(Boolean),
            map(() => this.getConfig())
        );
    }

    getConfig(): ClientSettingsResponse {
        return this.clientSettingCache.get();
    }

    private retrieveConfigFromApi(): Observable<ClientSettingsResponse> {
        let url = '/api/config';
        url = url.replace(/[?&]$/, '');
        return this.httpClient.get<ClientSettingsResponse>(url);
    }
}
