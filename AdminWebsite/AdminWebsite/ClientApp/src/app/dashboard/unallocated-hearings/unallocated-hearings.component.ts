import { Component, OnInit } from '@angular/core';
import { BHClient, UnallocatedHearingsForVhoResponse, UserProfileResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-unallocated-hearings',
    templateUrl: './unallocated-hearings.component.html',
    styleUrls: ['./unallocated-hearings.component.css']
})
export class UnallocatedHearingsComponent implements OnInit {
    private loggerPrefix = 'UnallocatedHearingsComponent';
    todayDate: any;
    tomorrowDate: any;
    weekDate: any;
    monthDate: any;
    unallocatedHearings: UnallocatedHearingsForVhoResponse;
    isVhTeamLeader: boolean;
    get getTodayCount(): number {
        return this.unallocatedHearings?.today?.count ?? 0;
    }
    get getTomorrowsCount(): number {
        return this.unallocatedHearings?.tomorrow?.count ?? 0;
    }
    get getThisWeeksCount(): number {
        return this.unallocatedHearings?.this_week?.count ?? 0;
    }
    get getThisMonthsCount(): number {
        return this.unallocatedHearings?.this_month?.count ?? 0;
    }

    constructor(private client: BHClient, private logger: Logger, private userIdentityService: UserIdentityService) {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
    }

    ngOnInit(): void {
        this.client.getUnallocatedHearings().subscribe(
            result => {
                this.unallocatedHearings = result;
                this.setRouterParameters();
            },
            error => this.logger.error(`${this.loggerPrefix} Could not get unallocated hearings`, error)
        );
    }
    private setRouterParameters() {
        const format = (dt: Date) => dt.toISOString().split('T')[0];

        this.todayDate = {
            fromDt: format(this.unallocatedHearings?.today?.date_start)
        };
        this.tomorrowDate = {
            fromDt: format(this.unallocatedHearings?.tomorrow?.date_start)
        };
        this.weekDate = {
            fromDt: format(this.unallocatedHearings?.this_week?.date_start),
            toDt: format(this.unallocatedHearings?.this_week?.date_end)
        };
        this.monthDate = {
            fromDt: format(this.unallocatedHearings?.this_month?.date_start),
            toDt: format(this.unallocatedHearings?.this_month?.date_end)
        };
    }
}
