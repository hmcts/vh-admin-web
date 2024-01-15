import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { first, Observable, of } from 'rxjs';
import { LaunchDarklyService, FeatureFlags } from 'src/app/services/launch-darkly.service';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';

@Injectable()
export class EditMultiDayBookingGuard implements CanActivate {
    multiDayBookingEnhancementsEnabled: boolean;
    constructor(private videoHearingService: VideoHearingsService, private featureService: LaunchDarklyService) {
        this.featureService
            .getFlag<boolean>(FeatureFlags.multiDayBookingEnhancements)
            .pipe(first())
            .subscribe(result => {
                this.multiDayBookingEnhancementsEnabled = result;
            });
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const booking = this.videoHearingService.getCurrentRequest();
        if (booking.isMultiDay && this.multiDayBookingEnhancementsEnabled) {
            return of(false);
        }
        return of(true);
    }
}
