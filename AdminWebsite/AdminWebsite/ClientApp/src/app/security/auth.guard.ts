import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageUrls } from '../shared/page-url.constants';
import { Logger } from '../services/logger';
import { VhOidcSecurityService } from './vh-oidc-security.service';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly loggerPrefix = '[AuthorizationGuard] -';
    constructor(private oidcSecurityService: VhOidcSecurityService, private router: Router, private logger: Logger) {}

    canActivate(): Observable<boolean> {
        return this.oidcSecurityService.isAuthenticated().pipe(
            map(isAuthenticated => {
                if (!isAuthenticated) {
                    this.logger.warn(`${this.loggerPrefix}- canActivate isAuthorized: ` + isAuthenticated);
                    this.router.navigate([`/${PageUrls.Login}`]);
                    return false;
                }
                this.logger.debug(`${this.loggerPrefix}- canActivate isAuthorized: ` + isAuthenticated);
                return true;
            })
        );
    }
}
