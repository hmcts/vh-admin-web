import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { Observable } from 'rxjs';
import { Logger } from '../../services/logger';

@Injectable()
export class LastMinuteAmendmentsGuard {
    constructor(
        private readonly videoHearingsService: VideoHearingsService,
        private readonly router: Router,
        private readonly logger: Logger
    ) {}

    canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        const exceptionToRuleCheck = route.data?.exceptionToRuleCheck as boolean;
        if (!this.videoHearingsService.isConferenceClosed() && this.videoHearingsService.isHearingAboutToStart()) {
            if (exceptionToRuleCheck) {
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
