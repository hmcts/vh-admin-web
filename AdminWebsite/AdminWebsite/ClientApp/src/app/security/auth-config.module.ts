import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AuthInterceptor, AuthModule, LogLevel, OpenIdConfiguration, StsConfigHttpLoader, StsConfigLoader } from 'angular-auth-oidc-client';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ClientSettingsResponse } from '../services/clients/api-client';
import { ConfigService } from '../services/config.service';
import { RefreshTokenParameterInterceptor } from './refresh-token-parameter.interceptor';
import { ReformLoginComponent } from './reform-login/reform-login.component';

export const configLoaderFactory = (configService: ConfigService) => {
    const config$ = configService.getClientSettings().pipe(
        map((clientSettings: ClientSettingsResponse) => {
            const vhResourceScope = clientSettings.vh_aad_configuration.resource_id
                ? clientSettings.vh_aad_configuration.resource_id
                : `api://${clientSettings.vh_aad_configuration.client_id}`;

            const vhaad = {
                configId: 'vhaad',
                authority: `https://login.microsoftonline.com/${clientSettings.vh_aad_configuration.tenant_id}/v2.0`,
                redirectUrl: clientSettings.vh_aad_configuration.redirect_uri,
                postLogoutRedirectUri: clientSettings.vh_aad_configuration.post_logout_redirect_uri,
                clientId: clientSettings.vh_aad_configuration.client_id,
                scope: `openid profile offline_access ${vhResourceScope}/feapi`,
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

            const dom1ResourceScope = clientSettings.dom1_idp_configuration.resource_id
                ? clientSettings.dom1_idp_configuration.resource_id
                : `api://${clientSettings.dom1_idp_configuration.client_id}`;
            const dom1 = {
                configId: 'dom1',
                authority: `https://login.microsoftonline.com/${clientSettings.dom1_idp_configuration.tenant_id}/v2.0`,
                redirectUrl: clientSettings.dom1_idp_configuration.redirect_uri,
                postLogoutRedirectUri: clientSettings.dom1_idp_configuration.post_logout_redirect_uri,
                clientId: '0e4a7fb5-684a-44f5-a924-16bb079354de',
                scope: `openid profile offline_access ${dom1ResourceScope}/feapi`,
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
            return [dom1, vhaad];
        })
    );

    return new StsConfigHttpLoader(config$);
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
    exports: [AuthModule],
    declarations: [ReformLoginComponent]
})
export class AuthConfigModule {}
