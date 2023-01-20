import { Component, EventEmitter, OnInit } from '@angular/core';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';

@Component({
    selector: 'app-work-allocation',
    templateUrl: './work-allocation.component.html',
    styleUrls: ['./work-allocation.component.scss']
})
export class WorkAllocationComponent implements OnInit {
    public isVhTeamLeader = false;

    showSaveConfirmation = false;
    dataChangedBroadcast = new EventEmitter<boolean>();

    constructor(private userIdentityService: UserIdentityService) {}

    ngOnInit() {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
    }

    onDataChange($event: boolean) {
        this.showSaveConfirmation = $event;
    }

    handleContinue() {
        this.showSaveConfirmation = false;
        this.dataChangedBroadcast.emit(false);
    }

    cancelEditing() {
        this.showSaveConfirmation = false;
        this.dataChangedBroadcast.emit(true);
    }
}
