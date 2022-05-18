import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { VideoHearingsService } from '../services/video-hearings.service';
import { Observable } from 'rxjs';
import { FeatureFlagService } from '../services/feature-flag.service';
import { first } from 'rxjs/operators';

@Injectable()
export class LastMinuteAmendmentsGuard implements CanActivate {
    eJudFeatureFlag: boolean;
    constructor(private videoHearingsService: VideoHearingsService, private router: Router, private featureService: FeatureFlagService) {
        featureService
            .getFeatureFlagByName('EJudFeature')
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
            return false;
        } else {
            return true;
        }
    }
}
