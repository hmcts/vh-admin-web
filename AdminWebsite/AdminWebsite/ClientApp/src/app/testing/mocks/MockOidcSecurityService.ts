import { PublicConfiguration } from 'angular-auth-oidc-client';
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

export class MockOidcSecurityService {
    userData: UserData;
    authenticated: boolean;
    throwsError: boolean;
    configuration = {
        configuration: {
            scope: 'openid profile offline_access'
        }
    } as PublicConfiguration;

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

    get isAuthenticated$(): Observable<boolean> {
        if (this.throwsError) {
            return throwError('error');
        }
        return of(this.authenticated);
    }

    getToken(): string {
        return 'MockToken';
    }

    checkAuth(url?: string): Observable<boolean> {
        return of(this.authenticated);
    }

    logoffAndRevokeTokens() {
        this.setAuthenticated(false);
        this.setUserData(null);
    }
}
