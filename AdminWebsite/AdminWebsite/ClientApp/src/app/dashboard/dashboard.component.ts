import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../services/launch-darkly.service';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';

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

    showCheckList = false;
    showBooking = false;
    showWorkAllocation = false;
    vhoWorkAllocationFeature = false;
    hrsIntegrationFeature: boolean = true;
    $ldSubcription: Subscription;

    ngOnInit() {
        this.$ldSubcription = this.launchDarklyService.flagChange.subscribe(value => {
            if (value) {
                this.vhoWorkAllocationFeature = value[FeatureFlags.vhoWorkAllocation];
                //this.hrsIntegrationFeature = value[FeatureFlags.hrsIntegration];
            }

            this.userIdentityService
                .getUserInformation()
                .toPromise()
                .then(profile => {
                    this.showCheckList = profile.is_vh_officer_administrator_role;
                    this.showWorkAllocation = profile.is_vh_team_leader && this.vhoWorkAllocationFeature;
                    this.showBooking = profile.is_case_administrator || profile.is_vh_officer_administrator_role;
                    this.logger.debug(`${this.loggerPrefix} Landed on dashboard`, {
                        showCheckList: this.showCheckList,
                        showBooking: this.showBooking,
                        showWorkAllocation: this.showWorkAllocation
                    });
                });
        });
    }

    ngOnDestroy() {
        this.$ldSubcription?.unsubscribe();
    }
}
