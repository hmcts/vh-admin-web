import { Component } from '@angular/core';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';

@Component({
    selector: 'app-work-allocation',
    templateUrl: './work-allocation.component.html',
    styleUrls: ['./work-allocation.component.scss']
})
export class WorkAllocationComponent {
    public isVhTeamLeader = false;

    constructor(private userIdentityService: UserIdentityService) {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
    }
}
