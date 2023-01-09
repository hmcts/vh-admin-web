import { Component, OnInit } from '@angular/core';
import { BHClient, UnallocatedHearingsForVHOResponse, UserProfileResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { UserIdentityService } from '../../services/user-identity.service';

@Component({
    selector: 'app-unallocated-hearings',
    templateUrl: './unallocated-hearings.component.html',
    styleUrls: ['./unallocated-hearings.component.css']
})
export class UnallocatedHearingsComponent implements OnInit {
    private loggerPrefix = 'UnallocatedHearingsComponent';
    unallocatedHearings: UnallocatedHearingsForVHOResponse;
    isLoaded: boolean;
    isVhTeamLeader: boolean;
    constructor(private client: BHClient, private logger: Logger, private userIdentityService: UserIdentityService) {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
    }

    ngOnInit(): void {
        this.client.getUnallocatedHearings().subscribe(
            result => {
                this.unallocatedHearings = result;
                this.isLoaded = true;
            },
            error => {
                this.logger.error(`${this.loggerPrefix} Could not get unallocated hearings`, error);
                this.unallocatedHearings = new UnallocatedHearingsForVHOResponse();
                this.isLoaded = true;
            }
        );
    }
}
