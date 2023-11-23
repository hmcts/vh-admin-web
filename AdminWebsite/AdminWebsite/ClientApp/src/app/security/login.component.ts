import { Router } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { ReturnUrlService } from '../services/return-url.service';
import { LoggerService } from '../services/logger.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError } from 'rxjs/operators';
import { NEVER } from 'rxjs';
import {WindowRef} from "./window-ref";
import {SecurityConfigService} from "./services/security-config.service";
import {ISecurityService} from "./services/security-service.interface";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
@Injectable()
export class LoginComponent implements OnInit {
    private readonly loggerPrefix = '[Login] -';
    private currentIdp: string;
    securityService: ISecurityService;
    constructor(
        private configService: SecurityConfigService,
        private router: Router,
        private logger: LoggerService,
        private returnUrlService: ReturnUrlService,
        private window: WindowRef
    ) {
        this.configService.currentIdpConfigId$.subscribe(idp => {
            this.currentIdp = idp;
        });
        this.securityService = this.configService.getSecurityService();
    }

    ngOnInit() {
        const isReformLogin = this.window.getLocation().href.includes('reform');
        const configId = isReformLogin ? 'reform' : this.currentIdp;
        this.configService.currentIdpConfigId = configId;
        this.securityService.isAuthenticated(configId)
            .pipe(
                catchError(err => {
                    this.logger.error(`${this.loggerPrefix} Check Auth Error`, err);
                    this.router.navigate(['/']);
                    return NEVER;
                })
            )
            .subscribe(isAuthenticated => {
                this.logger.debug(`${this.loggerPrefix} isLoggedIn: ` + isAuthenticated);
                const returnUrl = this.returnUrlService.popUrl() || '/';
                if (isAuthenticated) {
                    try {
                        this.logger.debug(`${this.loggerPrefix} Return url: ${returnUrl}`);
                        this.router.navigateByUrl(returnUrl);
                    } catch (err) {
                        this.logger.error(
                            `${this.loggerPrefix} Failed to navigate to redirect url, possibly stored url is invalid`,
                            err,
                            {
                                returnUrl
                            }
                        );
                        this.router.navigate(['/']);
                    }
                } else {
                    this.logger.debug(`${this.loggerPrefix} User not authenticated. Logging in`);
                    try {
                        this.returnUrlService.setUrl(returnUrl);
                        this.securityService.authorize(configId);
                    } catch (err) {
                        this.logger.error(`${this.loggerPrefix} Authorize Failed`, err);
                    }
                }
            });
    }
}
