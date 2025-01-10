import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Logger } from '../../services/logger';
import { IdpProviders, SecurityService } from '../services/security.service';
import { PageUrls } from '../../shared/page-url.constants';

@Injectable()
export class AuthGuard {
    private readonly loggerPrefix = '[AuthorizationGuard] -';
    constructor(
        private readonly securityService: SecurityService,
        private readonly router: Router,
        private readonly logger: Logger
    ) {}
    canActivate(): Observable<boolean> {
        return this.securityService.isAuthenticated().pipe(
            map(isAuthenticated => {
                if (!isAuthenticated) {
                    this.logger.warn(`${this.loggerPrefix}- canActivate isAuthorized: ` + isAuthenticated);
                    if (this.securityService.currentIdpConfigId === IdpProviders.reform) {
                        this.router.navigate([`/${PageUrls.LoginReform}`]);
                    } else {
                        this.router.navigate([`/${PageUrls.Login}`]);
                    }

                    return false;
                }
                this.logger.debug(`${this.loggerPrefix}- canActivate isAuthorized: ` + isAuthenticated);
                return true;
            })
        );
    }
}
