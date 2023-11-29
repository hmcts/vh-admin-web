import { OpenIdConfiguration, LoginResponse, AuthenticatedResult, ConfigAuthenticatedResult } from 'angular-auth-oidc-client';
import { combineLatest, Observable, of } from 'rxjs';
import { IdpProviders } from '../../security/services/security.service';

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
    constructor(configId: string, isAuthenticated: boolean) {
        this.configId = configId;
        this.isAuthenticated = isAuthenticated;
    }

    isAuthenticated: boolean;
    userData: any;
    accessToken: string;
    idToken: string;
    configId: string;
    errorMessage?: string;
}

export class MockAuthenticatedResult implements AuthenticatedResult {
    constructor(configResults: ConfigAuthenticatedResult[], isAuthenticated: boolean = false) {
        this.isAuthenticated = isAuthenticated;
        this.allConfigsAuthenticated = configResults;
    }

    isAuthenticated: boolean;
    allConfigsAuthenticated: ConfigAuthenticatedResult[];
}

export class MockSecurityService {
    private currentIdpProvider: IdpProviders = IdpProviders.main;
    userData: UserData;
    authenticatedResult: AuthenticatedResult;
    configuration = {
        scope: 'openid profile offline_access'
    } as OpenIdConfiguration;

    setAuthenticatedResult(configId: string, isAuthenticated: boolean): void {
        this.authenticatedResult.allConfigsAuthenticated.find(x => x.configId === configId).isAuthenticated = isAuthenticated;
    }

    constructor() {
        this.authenticatedResult = new MockAuthenticatedResult([
            { configId: IdpProviders.main, isAuthenticated: false },
            { configId: IdpProviders.reform, isAuthenticated: false }
        ]);
    }

    set currentIdpConfigId(idpConfigId: IdpProviders) {
        this.currentIdpProvider = idpConfigId;
    }

    get currentIdpConfigId(): IdpProviders {
        return this.currentIdpProvider;
    }

    authorize(): void {
        return null;
    }

    isAuthenticated(): Observable<boolean> {
        return of(this.authenticatedResult.allConfigsAuthenticated.find(x => x.configId === this.currentIdpProvider).isAuthenticated);
    }

    checkAuthMultiple(): Observable<LoginResponse[]> {
        return combineLatest([
            of(
                new MockLoginResponse(IdpProviders.main,
                    this.authenticatedResult.allConfigsAuthenticated.find(x => x.configId === IdpProviders.main).isAuthenticated
                )
            ),
            of(
                new MockLoginResponse(IdpProviders.reform,
                    this.authenticatedResult.allConfigsAuthenticated.find(x => x.configId === IdpProviders.reform).isAuthenticated
                )
            )
        ]);
    }

    getAccessToken(): Observable<string> {
        return of('MockToken');
    }

    logoffAndRevokeTokens(): Observable<any> {
        this.authenticatedResult.allConfigsAuthenticated.forEach(x => (x.isAuthenticated = false));
        this.userData = null;
        return of(null);
    }

    getConfiguration(): Observable<OpenIdConfiguration> {
        return of(this.configuration);
    }
}
