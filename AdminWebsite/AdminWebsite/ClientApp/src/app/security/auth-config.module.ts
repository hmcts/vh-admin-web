import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import {
    AuthInterceptor,
    AuthModule,
    LogLevel,
    OpenIdConfiguration,
    StsConfigHttpLoader,
    StsConfigLoader
} from 'angular-auth-oidc-client';
import {first, map} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {ClientSettingsResponse} from '../services/clients/api-client';
import { ConfigService } from '../services/config.service';
import { RefreshTokenParameterInterceptor } from './refresh-token-parameter.interceptor';
import {Observable} from "rxjs";

export const configLoaderFactory = (configService: ConfigService) => {
    const configs$: Observable<OpenIdConfiguration[]> = configService.getClientSettings().pipe(
        first(),
        map((clientSettings: ClientSettingsResponse) => {
            const resource = clientSettings.resource_id ? clientSettings.resource_id : `api://${clientSettings.client_id}`;
            const resourceReform = clientSettings.reform_tenant_config.resource_id ? clientSettings.reform_tenant_config.resource_id : `api://${clientSettings.reform_tenant_config.client_id}`;

            const config = {
                configId: 'main',
                authority: `https://login.microsoftonline.com/${clientSettings.tenant_id}/v2.0`,
                redirectUrl: clientSettings.redirect_uri,
                postLogoutRedirectUri: clientSettings.post_logout_redirect_uri,
                clientId: clientSettings.client_id,
                scope: `openid profile offline_access ${resource}/feapi`,
                responseType: 'code',
                maxIdTokenIatOffsetAllowedInSeconds: 600,
                autoUserInfo: false,
                logLevel: environment.production ? LogLevel.Warn : LogLevel.Debug,
                secureRoutes: ['.'],
                ignoreNonceAfterRefresh: true,
                tokenRefreshInSeconds: 5,
                silentRenew: true,
                useRefreshToken: true
            } as OpenIdConfiguration;

            const configReform = {
                configId: 'reform',
                authority: `https://login.microsoftonline.com/${clientSettings.reform_tenant_config.tenant_id}/v2.0`,
                redirectUrl: clientSettings.reform_tenant_config.redirect_uri,
                postLogoutRedirectUri: clientSettings.reform_tenant_config.post_logout_redirect_uri,
                clientId: clientSettings.reform_tenant_config.client_id,
                scope: `openid profile offline_access ${resourceReform}/feapi`,
                responseType: 'code',
                maxIdTokenIatOffsetAllowedInSeconds: 600,
                autoUserInfo: false,
                logLevel: environment.production ? LogLevel.Warn : LogLevel.Debug,
                secureRoutes: ['.'],
                ignoreNonceAfterRefresh: true,
                tokenRefreshInSeconds: 5,
                silentRenew: true,
                useRefreshToken: true
            } as OpenIdConfiguration;

            return [config, configReform]
        })
    );
    return new StsConfigHttpLoader(configs$);
};

@NgModule({
    imports: [
        AuthModule.forRoot({
            loader: {
                provide: StsConfigLoader,
                useFactory: configLoaderFactory,
                deps: [ConfigService]
            }
        })
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: RefreshTokenParameterInterceptor, multi: true }
    ],
    exports: [AuthModule]
})
export class AuthConfigModule {}
