import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest, lastValueFrom, takeUntil } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../services/launch-darkly.service';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[Dashboard] -';
    constructor(
        private launchDarklyService: LaunchDarklyService,
        private userIdentityService: UserIdentityService,

        private logger: Logger
    ) {}

    faUsers = faUsers;

    showCheckList = false;
    showBooking = false;
    showWorkAllocation = false;
    dom1Feature = false;

    showManageTeam = false;
    showAudioFileLink = false;

    destroyed$ = new Subject<void>();

    ngOnInit() {
        const dom1FeatureFlag$ = this.launchDarklyService.getFlag<boolean>(FeatureFlags.dom1Integration).pipe(takeUntil(this.destroyed$));

        combineLatest([dom1FeatureFlag$]).subscribe(([dom1FeatureFlag]) => {
            this.dom1Feature = dom1FeatureFlag;
            lastValueFrom(this.userIdentityService.getUserInformation()).then(profile => {
                this.showCheckList = profile.is_vh_officer_administrator_role;
                this.showWorkAllocation = profile.is_vh_team_leader;
                this.showAudioFileLink = this.showCheckList;
                this.showBooking = profile.is_case_administrator || profile.is_vh_officer_administrator_role;
                this.showManageTeam = profile.is_vh_team_leader && this.dom1Feature;
                this.logger.debug(`${this.loggerPrefix} Landed on dashboard`, {
                    showCheckList: this.showCheckList,
                    showBooking: this.showBooking,
                    showWorkAllocation: this.showWorkAllocation
                });
            });
        });
    }

    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
    }
}
