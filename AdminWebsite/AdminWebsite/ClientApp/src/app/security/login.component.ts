import { Router } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { ReturnUrlService } from '../services/return-url.service';
import { LoggerService } from '../services/logger.service';
import { catchError } from 'rxjs/operators';
import { NEVER } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { VhOidcSecurityService } from './vh-oidc-security.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
@Injectable()
export class LoginComponent implements OnInit {
    private readonly loggerPrefix = '[Login] -';

    constructor(
        private oidcSecurityService: VhOidcSecurityService,
        private router: Router,
        private logger: LoggerService,
        private returnUrlService: ReturnUrlService,
        private configService: ConfigService
    ) {}

    ngOnInit() {
        this.configService.getClientSettings().subscribe(() => {
            this.oidcSecurityService
                .isAuthenticated()
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
                            this.oidcSecurityService.authorize();
                        } catch (err) {
                            this.logger.error(`${this.loggerPrefix} Authorize Failed`, err);
                        }
                    }
                });
        });
    }
}
