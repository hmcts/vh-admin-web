import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';
import { IUserProfileResponse } from '../../services/clients/api-client';

@Injectable()
export class AdminGuard {
    private readonly loggerPrefix = '[AdminGuard] -';

    constructor(
        private readonly userIdentityService: UserIdentityService,
        private readonly router: Router,
        private readonly logger: Logger
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        this.logger.debug(`${this.loggerPrefix} Checking if user is vho or case admin.`);

        return this.userIdentityService.getUserInformation().pipe(
            map((userProfile: IUserProfileResponse) => {
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
    }
}
