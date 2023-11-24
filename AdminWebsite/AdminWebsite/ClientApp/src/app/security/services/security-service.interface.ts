import {Observable} from "rxjs";
import {LoginResponse, LogoutAuthOptions} from "angular-auth-oidc-client";
import {AuthenticatedResult} from "angular-auth-oidc-client/lib/auth-state/auth-result";
import {OpenIdConfiguration} from "angular-auth-oidc-client/lib/config/openid-configuration";

export interface ISecurityService {
    getConfigurations(): OpenIdConfiguration[];
    checkAuthMultiple(url?: string): Observable<LoginResponse[]>;
    get isAuthenticated$(): Observable<AuthenticatedResult>;
    isAuthenticated(configId: string): Observable<boolean>;
    getUserData(configId: string): Observable<any>;
    authorize(configId: string): void;
    checkAuth(url: string, configId?: string): Observable<LoginResponse>;
    logoffAndRevokeTokens(configId: string, logoutAuthOptions?: LogoutAuthOptions): Observable<any>;
    getAccessToken(configId: string): Observable<string>;
}
