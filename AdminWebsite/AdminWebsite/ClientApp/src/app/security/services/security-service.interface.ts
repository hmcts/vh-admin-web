import {Observable} from "rxjs";
import {LoginResponse, LogoutAuthOptions} from "angular-auth-oidc-client";

export interface ISecurityService {
    isAuthenticated(configId: string): Observable<boolean>;
    getUserData(configId: string): Observable<any>;
    authorize(configId: string): void;
    checkAuth(url: string, configId?: string): Observable<LoginResponse>;
    logoffAndRevokeTokens(configId: string, logoutAuthOptions?: LogoutAuthOptions): Observable<any>;
}
