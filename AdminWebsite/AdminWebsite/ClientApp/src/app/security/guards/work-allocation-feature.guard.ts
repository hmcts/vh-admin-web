import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../../services/launch-darkly.service';
import { map, take } from 'rxjs/operators';

@Injectable()
export class WorkAllocationFeatureGuard implements CanActivate {
    private readonly loggerPrefix = '[WorkAllocationFeatureGuard] -';

    constructor(private launchDarklyService: LaunchDarklyService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.launchDarklyService.getFlag<boolean>(FeatureFlags.vhoWorkAllocation).pipe(
            take(1),
            map(featureEnabled => {
                if (featureEnabled) {
                    return true;
                }
                this.router.navigate(['/']);
                return false;
            })
        );
    }
}
