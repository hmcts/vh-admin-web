import { Component, OnInit } from '@angular/core';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    private readonly loggerPrefix = '[Dashboard] -';
    constructor(private userIdentityService: UserIdentityService, private logger: Logger) {}

    showCheckList = false;
    showBooking = false;

    ngOnInit() {
        this.userIdentityService
            .getUserInformation()
            .toPromise()
            .then(profile => {
                this.showCheckList = profile.is_vh_officer_administrator_role;
                this.showBooking = profile.is_case_administrator || profile.is_vh_officer_administrator_role;
                this.logger.debug(`${this.loggerPrefix} Landed on dashboard`, {
                    showCheckList: this.showCheckList,
                    showBooking: this.showBooking
                });
            });
    }
}
