import { Injectable } from '@angular/core';
import { ClientSettingsResponse } from '../services/clients/api-client';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Config } from '../common/model/config';

export let ENVIRONMENT_CONFIG: Config = new Config();

@Injectable()
export class ConfigService {
  clientSettings: ClientSettingsResponse;
  private settingsSessionKey = 'clientSettings';
  private httpClient: HttpClient;

  constructor(handler: HttpBackend) {
    this.httpClient = new HttpClient(handler);
  }

  getClientSettings(): Observable<ClientSettingsResponse> {
    const settings = sessionStorage.getItem(this.settingsSessionKey);
    if (!settings) {
      return this.retrieveConfigFromApi();
    } else {
      return of(JSON.parse(settings));
    }
  }

  loadConfig() {
    return new Promise((resolve, reject) => {
      this.getClientSettings().subscribe((data: ClientSettingsResponse) => {
        this.clientSettings = data;
        this.parse(data);
        sessionStorage.setItem(this.settingsSessionKey, JSON.stringify(data));
        resolve(true);
      }, err => resolve(err));
    });
  }

  private retrieveConfigFromApi(): Observable<ClientSettingsResponse> {
    let url = '/api/config';
    url = url.replace(/[?&]$/, '');
    return this.httpClient.get<ClientSettingsResponse>(url);
  }

  private parse(result: any): Promise<Config> {
    ENVIRONMENT_CONFIG = new Config();
    ENVIRONMENT_CONFIG.tenantId = result.tenant_id;
    ENVIRONMENT_CONFIG.clientId = result.client_id;
    ENVIRONMENT_CONFIG.redirectUri = result.redirect_uri;
    ENVIRONMENT_CONFIG.postLogoutRedirectUri = result.post_logout_redirect_uri;
    ENVIRONMENT_CONFIG.appInsightsInstrumentationKey = result.instrumentation_key;
    return Promise.resolve(ENVIRONMENT_CONFIG);
  }
}
