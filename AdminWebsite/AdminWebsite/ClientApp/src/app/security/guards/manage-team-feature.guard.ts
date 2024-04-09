import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../../services/launch-darkly.service';
import { map, take } from 'rxjs/operators';

@Injectable()
export class ManageTeamFeatureGuard {
    constructor(private launchDarklyService: LaunchDarklyService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.launchDarklyService.getFlag<boolean>(FeatureFlags.dom1Integration).pipe(
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
