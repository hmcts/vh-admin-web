import { OpenIdConfiguration, LoginResponse, AuthenticatedResult, ConfigAuthenticatedResult } from 'angular-auth-oidc-client';
import { Observable, of, throwError } from 'rxjs';
interface UserData {
    preferred_username?: string;
    name?: string;
    email?: string;
    email_verified?: false;
    given_name?: string;
    role?: string;
    amr?: string;
}

class MockLoginResponse implements LoginResponse {
    constructor(isAuthenticated: boolean) {
        this.isAuthenticated = isAuthenticated;
    }

    isAuthenticated: boolean;
    userData: any;
    accessToken: string;
    idToken: string;
    configId: string;
    errorMessage?: string;
}

class MockAuthenticatedResult implements AuthenticatedResult {
    constructor(isAuthenticated: boolean) {
        this.isAuthenticated = isAuthenticated;
    }

    isAuthenticated: boolean;
    allConfigsAuthenticated: ConfigAuthenticatedResult[];
}

export class MockOidcSecurityService {
    userData: UserData;
    authenticated: boolean;
    throwsError: boolean;
    configuration = {
        scope: 'openid profile offline_access'
    } as OpenIdConfiguration;

    setAuthenticated(authenticated: boolean) {
        this.authenticated = authenticated;
    }

    setUserData(userData: UserData) {
        this.userData = userData;
    }

    setThrowErrorOnIsAuth(throwsError: boolean) {
        this.throwsError = throwsError;
    }

    get userData$(): Observable<UserData> {
        return of(this.userData);
    }

    get isAuthenticated$(): Observable<AuthenticatedResult> {
        if (this.throwsError) {
            return throwError('error');
        }
        return of(new MockAuthenticatedResult(this.authenticated));
    }

    getToken(): string {
        return 'MockToken';
    }

    checkAuth(url?: string): Observable<LoginResponse> {
        return of(new MockLoginResponse(this.authenticated));
    }

    logoffAndRevokeTokens() {
        this.setAuthenticated(false);
        this.setUserData(null);
    }

    getConfiguration(): Observable<OpenIdConfiguration> {
        return of(this.configuration);
    }
}
