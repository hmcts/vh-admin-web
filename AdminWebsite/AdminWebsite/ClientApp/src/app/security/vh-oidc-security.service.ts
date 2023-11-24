import { Injectable } from '@angular/core';
import { LoginResponse, OidcSecurityService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

export enum IdpProviders {
    vhaad = 'vhaad',
    dom1 = 'dom1'
}

@Injectable({
    providedIn: 'root'
})
export class VhOidcSecurityService {
    private idpProvidersSessionStorageKey = 'IdpProviders';
    private defaultProvider = IdpProviders.vhaad;

    private currentIdpProvider: IdpProviders;

    constructor(private oidcSecurityService: OidcSecurityService) {
        this.restoreConfig();
    }

    restoreConfig() {
        this.currentIdpProvider = this.getIdp();
    }

    setIdp(provider: IdpProviders) {
        this.currentIdpProvider = provider;
        window.sessionStorage.setItem(this.idpProvidersSessionStorageKey, provider);
    }

    getIdp(): IdpProviders {
        return (window.sessionStorage.getItem(this.idpProvidersSessionStorageKey) as IdpProviders) ?? this.defaultProvider;
    }

    isAuthenticated(): Observable<boolean> {
        return this.oidcSecurityService.isAuthenticated(this.currentIdpProvider);
    }

    getUserData(): Observable<any> {
        return this.oidcSecurityService.getUserData(this.currentIdpProvider);
    }

    getConfiguration(): Observable<OpenIdConfiguration> {
        return this.oidcSecurityService.getConfiguration(this.currentIdpProvider);
    }

    authorize(): void {
        this.oidcSecurityService.authorize(this.currentIdpProvider);
    }

    checkAuth(): Observable<LoginResponse> {
        return this.oidcSecurityService.checkAuth(undefined, this.currentIdpProvider);
    }

    checkAuthMultiple(): Observable<LoginResponse[]> {
        return this.oidcSecurityService.checkAuthMultiple(null);
    }

    getAccessToken(): Observable<string> {
        return this.oidcSecurityService.getAccessToken(this.currentIdpProvider);
    }

    logoffAndRevokeTokens(): Observable<any> {
        window.sessionStorage.removeItem(this.idpProvidersSessionStorageKey);
        return this.oidcSecurityService.logoffAndRevokeTokens(this.currentIdpProvider);
    }
}
