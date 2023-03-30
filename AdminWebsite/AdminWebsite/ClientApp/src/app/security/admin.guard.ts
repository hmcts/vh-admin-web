import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';

@Injectable()
export class AdminGuard implements CanActivate {
    private readonly loggerPrefix = '[AdminGuard] -';

    constructor(
        private userIdentityService: UserIdentityService,
        private oidcSecurityService: OidcSecurityService,
        private router: Router,
        private logger: Logger
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        this.logger.debug(`${this.loggerPrefix} Checking if user is vho or case admin.`);

        return this.oidcSecurityService.isAuthenticated$.pipe(
            mergeMap(isAuthenticated => {
                if (!isAuthenticated) {
                    this.logger.debug(`${this.loggerPrefix} User is not authenticated. Navigating to unauthorised.`);
                    this.router.navigate(['/unauthorised']);
                    return of(false);
                }
                return this.userIdentityService.getUserInformation().pipe(
                    map(userProfile => {
                        if (userProfile?.is_vh_officer_administrator_role || userProfile?.is_case_administrator) {
                            this.logger.debug(`${this.loggerPrefix} Success! User is vho or case admin.`);
                            return true;
                        } else {
                            this.logger.warn(`${this.loggerPrefix} User is not in administrator role. Navigating to unauthorised.`);
                            this.router.navigate(['/unauthorised']);
                            return false;
                        }
                    })
                );
            })
        );
    }
}
