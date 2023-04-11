import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticatedResult, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageUrls } from '../shared/page-url.constants';
import { Logger } from '../services/logger';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly loggerPrefix = '[AuthorizationGuard] -';
    constructor(private oidcSecurityService: OidcSecurityService, private router: Router, private logger: Logger) {}

    canActivate(): Observable<boolean> {
        return this.oidcSecurityService.isAuthenticated$.pipe(
            map((result: AuthenticatedResult) => {
                if (!result.isAuthenticated) {
                    this.logger.warn(`${this.loggerPrefix}- canActivate isAuthorized: ` + result.isAuthenticated);
                    this.router.navigate([`/${PageUrls.Login}`]);
                    return false;
                }
                this.logger.debug(`${this.loggerPrefix}- canActivate isAuthorized: ` + result.isAuthenticated);
                return true;
            })
        );
    }
}
