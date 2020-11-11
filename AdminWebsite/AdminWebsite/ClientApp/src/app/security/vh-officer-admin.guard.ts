import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';

@Injectable()
export class VhOfficerAdminGuard implements CanActivate {
    private readonly loggerPrefix = '[VhOfficerAdminGuard] -';

    constructor(private userIdentityService: UserIdentityService, private router: Router, private logger: Logger) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        this.logger.debug(`${this.loggerPrefix} Checking if user is vho.`);
        return this.userIdentityService.getUserInformation().pipe(
            map(userProfile => {
                if (userProfile && userProfile.is_vh_officer_administrator_role) {
                    this.logger.debug(`${this.loggerPrefix} Success! User is vho.`);
                    return true;
                } else {
                    this.logger.warn(`${this.loggerPrefix} User is not in administrator role. Navigating to login.`);
                    this.router.navigate(['/login']);
                    return false;
                }
            }),
            catchError(err => {
                this.logger.error(`${this.loggerPrefix} Failed to get user identity. Navigating to login.`, err);
                this.router.navigate(['/login']);
                return of(false);
            })
        );
    }
}
