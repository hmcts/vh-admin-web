import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PageUrls } from '../shared/page-url.constants';
import { Logger } from '../services/logger';
import { FeatureFlags, LaunchDarklyService } from '../services/launch-darkly.service';

@Injectable()
export class AudioSearchGuard {
    private readonly loggerPrefix = '[AudioSearchGuard] -';
    constructor(
        private readonly launchDarklyService: LaunchDarklyService,
        private readonly router: Router,
        private readonly logger: Logger
    ) {}

    canActivate(): Observable<boolean> {
        return this.launchDarklyService.getFlag<boolean>(FeatureFlags.audioSearch).pipe(
            map(result => {
                if (result) {
                    this.logger.warn(`${this.loggerPrefix} - canActivate isAuthorized: false`);
                    this.router.navigate([`/${PageUrls.Login}`]);
                    return false;
                }
                this.logger.debug(`${this.loggerPrefix} - canActivate isAuthorized: true`);
                return true;
            })
        );
    }
}
