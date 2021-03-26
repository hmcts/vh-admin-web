import { Injectable } from '@angular/core';
import { ApplicationInsights, ITelemetryItem, SeverityLevel } from '@microsoft/applicationinsights-web';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ConfigService } from './config.service';
import { LogAdapter } from './log-adapter';

@Injectable()
export class AppInsightsLogger implements LogAdapter {
    errorInfo: any;
    appInsights: ApplicationInsights;

    constructor(private configService: ConfigService, private oidcService: OidcSecurityService) {
        this.configService.getClientSettings().subscribe(settings => {
            this.appInsights = new ApplicationInsights({
                config: {
                    instrumentationKey: settings.instrumentation_key
                }
            });
            this.appInsights.loadAppInsights();
            this.oidcService.userData$.subscribe(ud => {
                this.appInsights.addTelemetryInitializer((envelope: ITelemetryItem) => {
                    envelope.tags['ai.cloud.role'] = 'vh-admin-web';
                    envelope.tags['ai.user.id'] = ud.userName.toLowerCase();
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
        this.appInsights.trackPageView({ name: pageName, uri: url });
    }

    trackEvent(eventName: string, properties: any) {
        this.appInsights.trackEvent({ name: eventName }, properties);
    }

    trackException(message: string, err: Error, properties: any) {
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
