import { Injectable } from '@angular/core';
import { ApplicationInsights, ITelemetryItem, SeverityLevel } from '@microsoft/applicationinsights-web';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ConfigService } from './config.service';
import { LogAdapter } from './log-adapter';

@Injectable()
export class AppInsightsLogger implements LogAdapter {
    errorInfo: any;
    appInsights: ApplicationInsights;

    constructor(
        private readonly configService: ConfigService,
        private readonly oidcService: OidcSecurityService
    ) {
        this.configService.getClientSettings().subscribe(settings => {
            this.appInsights = new ApplicationInsights({
                config: {
                    connectionString: settings.connection_string
                }
            });
            this.appInsights.loadAppInsights();
            this.oidcService.userData$.subscribe(ud => {
                this.appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
                    const remoteDepedencyType = 'RemoteDependencyData';
                    if (envelope.baseType === remoteDepedencyType && (envelope.baseData.name as string)) {
                        const name = envelope.baseData.name as string;
                        if (name.startsWith('HEAD /assets/favicons/favicon.ico?')) {
                            // ignore favicon requests used to poll for availability
                            return false;
                        }
                    }
                    envelope.tags['ai.cloud.role'] = 'vh-admin-web';
                    envelope.tags['ai.user.id'] = ud.userData.preferred_username.toLowerCase();
                });
            });
        });
    }

    debug(message: string, properties: any = null): void {
        if (!this.appInsights) {
            return;
        }
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Verbose }, properties);
    }

    info(message: string, properties: any = null): void {
        if (!this.appInsights) {
            return;
        }
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Information }, properties);
    }

    warn(message: string, properties: any = null): void {
        if (!this.appInsights) {
            return;
        }
        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Warning }, properties);
    }

    trackPage(pageName: string, url: string) {
        if (!this.appInsights) {
            return;
        }
        this.appInsights.trackPageView({ name: pageName, uri: url });
    }

    trackEvent(eventName: string, properties: any) {
        if (!this.appInsights) {
            return;
        }
        this.appInsights.trackEvent({ name: eventName }, properties);
    }

    trackException(message: string, err: Error, properties: any) {
        if (!this.appInsights) {
            return;
        }
        properties = properties || {};
        properties.message = message;

        this.errorInfo = err;
        properties.errorInformation = this.errorInfo
            ? `${this.errorInfo.error} : ${this.errorInfo.status}
       : ${this.errorInfo.statusText} : ${this.errorInfo.url} : ${this.errorInfo.message}`
            : ``;

        this.appInsights.trackTrace({ message, severityLevel: SeverityLevel.Error }, properties);
        this.appInsights.trackException({
            error: err,
            properties: properties
        });
    }
}
