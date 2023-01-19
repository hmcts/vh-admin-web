import { Component, EventEmitter, OnInit } from '@angular/core';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-work-allocation',
    templateUrl: './work-allocation.component.html',
    styleUrls: ['./work-allocation.component.scss']
})
export class WorkAllocationComponent implements OnInit {
    public isVhTeamLeader = false;

    showSaveConfirmation = false;
    dataChangedBroadcast = new EventEmitter<boolean>();
    allocateHearingsDetailOpen: boolean;

    constructor(private userIdentityService: UserIdentityService, private route: ActivatedRoute) {}

    ngOnInit() {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
        this.route.queryParams.subscribe(params => {
            const unallocated = params['unallocated'];
            if (unallocated) {
                this.searchUnallocatedHearings(unallocated);
            }
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

    searchUnallocatedHearings(search: string) {
        this.allocateHearingsDetailOpen = true;
        switch (search) {
            // TBD:  once allocate hearings VIH-9366 implemented with hearing date range. Set date range and invoke search
            case 'today':
            case 'tomorrow':
            case 'week':
            case 'month':
            default:
                break;
        }
    }
}
