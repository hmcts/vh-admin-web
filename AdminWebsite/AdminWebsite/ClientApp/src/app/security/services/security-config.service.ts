import {LoginResponse, OidcSecurityService} from "angular-auth-oidc-client";
import {ISecurityService} from "./security-service.interface";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";

export enum IdpProviders {
    vhaad = 'vhaad',
    dom1 = 'dom1'
}

@Injectable({
    providedIn: 'root'
})
export class SecurityConfigService {
    private idpProvidersSessionStorageKey = 'IdpProviders';
    private default = IdpProviders.dom1;
    private currentIdpProvider: IdpProviders;
    constructor(private oidcSecurityService: OidcSecurityService) {}
    set currentIdpConfigId(idpConfigId: IdpProviders) {
        this.currentIdpProvider = idpConfigId;
        window.sessionStorage.setItem(this.idpProvidersSessionStorageKey, idpConfigId);
    }

    get currentIdpConfigId(): IdpProviders {
        return (window.sessionStorage.getItem(this.idpProvidersSessionStorageKey)) as IdpProviders ?? this.default;
    }

    getSecurityService(): ISecurityService {
        return this.oidcSecurityService;
    }

    authorize(): void {
        this.oidcSecurityService.authorize(this.currentIdpProvider);
    }
    isAuthenticated(): Observable<boolean> {
        return this.oidcSecurityService.isAuthenticated(this.currentIdpProvider);
    }

    checkAuth(): Observable<LoginResponse> {
        return this.oidcSecurityService.checkAuth(undefined, this.currentIdpProvider);
    }

    checkAuthMultiple(): Observable<LoginResponse[]> {
        return this.oidcSecurityService.checkAuthMultiple(null);
    }


}

