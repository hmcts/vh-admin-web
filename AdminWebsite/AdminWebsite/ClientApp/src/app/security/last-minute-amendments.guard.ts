import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { VideoHearingsService } from '../services/video-hearings.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageUrls } from '../shared/page-url.constants';

@Injectable()
export class LastMinuteAmendmentsGuard implements CanActivate {
    constructor(private videoHearingsService: VideoHearingsService, private router: Router) {}

    canActivate(): boolean {
        if (!this.videoHearingsService.isConferenceClosed() && this.videoHearingsService.isHearingAboutToStart()) {
            this.router.navigate(['/summary']);
            return false;
        } else {
            return true;
        }
    }
}
