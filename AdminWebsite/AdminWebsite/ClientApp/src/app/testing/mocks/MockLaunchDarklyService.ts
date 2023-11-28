import { OpenIdConfiguration, LoginResponse, AuthenticatedResult, ConfigAuthenticatedResult } from 'angular-auth-oidc-client';
import { LDFlagValue } from 'launchdarkly-js-client-sdk';
import { Observable, of } from 'rxjs';

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
export class MockLaunchDarklyService {
    audioSearchFlag: boolean;

    setAudioSearchFlag(flag: boolean) {
        this.audioSearchFlag = flag;
    }
    getFlag<T>(flagKey: string, defaultValue: LDFlagValue = false): Observable<T> {
        return of(this.audioSearchFlag as T);
    }
}
