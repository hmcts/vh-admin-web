import { LoginResponse, OidcSecurityService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export enum IdpProviders {
    reform = 'hearings-reform-tenant',
    main = 'main-tenant'
}

@Injectable({
    providedIn: 'root'
})
export class SecurityService {
    private readonly idpProvidersSessionStorageKey = 'IdpProviders';
    private currentIdpProvider: IdpProviders;

    constructor(private readonly oidcSecurityService: OidcSecurityService) {
        this.currentIdpProvider = (window.sessionStorage.getItem(this.idpProvidersSessionStorageKey) as IdpProviders) ?? IdpProviders.main;
    }

    set currentIdpConfigId(idpConfigId: IdpProviders) {
        this.currentIdpProvider = idpConfigId;
        window.sessionStorage.setItem(this.idpProvidersSessionStorageKey, idpConfigId);
    }

    get currentIdpConfigId(): IdpProviders {
        return this.currentIdpProvider;
    }

    authorize(): void {
        this.oidcSecurityService.authorize(this.currentIdpProvider);
    }

    isAuthenticated(): Observable<boolean> {
        return this.oidcSecurityService.isAuthenticated(this.currentIdpProvider);
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

    getConfiguration(): Observable<OpenIdConfiguration> {
        return this.oidcSecurityService.getConfiguration(this.currentIdpProvider);
    }
}
