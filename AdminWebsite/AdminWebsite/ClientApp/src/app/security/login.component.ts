import { Router, ActivatedRoute } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { ReturnUrlService } from '../services/return-url.service';
import { LoggerService } from '../services/logger.service';
import { WindowRef } from '../shared/window-ref';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError } from 'rxjs/operators';
import { NEVER } from 'rxjs';
import { ConfigService } from '../services/config.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
@Injectable()
export class LoginComponent implements OnInit {
    private readonly loggerPrefix = '[Login] -';

    constructor(
        private oidcSecurityService: OidcSecurityService,
        private route: ActivatedRoute,
        private router: Router,
        private logger: LoggerService,
        private returnUrlService: ReturnUrlService,
        private window: WindowRef,
        private configService: ConfigService
    ) { }

    ngOnInit() {
        this.configService.getClientSettingsObservable().subscribe(clientSettings => {
            this.oidcSecurityService
            .isAuthenticated$
            .pipe(
                catchError(err => {
                    this.logger.error(`${this.loggerPrefix} Check Auth Error`, err);
                    this.router.navigate(['/']);
                    return NEVER;
                })
            )
            .subscribe(loggedIn => {
                this.logger.debug(`${this.loggerPrefix} isLoggedIn ` + loggedIn);
                this.logger.debug(`${this.loggerPrefix} TOKEN` + this.oidcSecurityService.getToken());
                if (loggedIn) {
                    const returnUrl = this.returnUrlService.popUrl() || '/';
                    try {
                        this.logger.debug(`${this.loggerPrefix} Return url = ${returnUrl}`);
                        this.router.navigateByUrl(returnUrl);
                    } catch (err) {
                        this.logger.error(`${this.loggerPrefix} Failed to navigate to redirect url, possibly stored url is invalid`, err, {
                            returnUrl
                        });
                        this.router.navigate(['/']);
                    }
                } else {
                    this.logger.debug(`${this.loggerPrefix} User not authenticated. Logging in`);
                    try {
                        let dontSkip = true;
                        debugger;
                        if (dontSkip) {
                            this.oidcSecurityService.authorize();
                        };
                    } catch (err) {
                        this.logger.error(`${this.loggerPrefix} - Authorize Failed`, err);
                    }
                }
            });
        });
    }
}
