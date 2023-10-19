import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { VideoHearingsService } from '../services/video-hearings.service';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Logger } from '../services/logger';
import { FeatureFlags, LaunchDarklyService } from '../services/launch-darkly.service';

@Injectable()
export class LastMinuteAmendmentsGuard implements CanActivate {
    eJudFeatureFlag: boolean;
    constructor(
        private videoHearingsService: VideoHearingsService,
        private router: Router,
        private featureService: LaunchDarklyService,
        private logger: Logger
    ) {
        this.featureService
            .getFlag<boolean>(FeatureFlags.eJudFeature)
            .pipe(first())
            .subscribe(result => {
                this.eJudFeatureFlag = result;
            });
    }

    canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        const exceptionToRuleCheck = route.data?.exceptionToRuleCheck as boolean;
        if (!this.videoHearingsService.isConferenceClosed() && this.videoHearingsService.isHearingAboutToStart()) {
            if (exceptionToRuleCheck && this.eJudFeatureFlag) {
                return true;
            }
            this.router.navigate(['/summary']);
            this.logger.warn('[LastMinuteGuard] - canActivate: False');
            return false;
        } else {
            return true;
        }
    }
}
