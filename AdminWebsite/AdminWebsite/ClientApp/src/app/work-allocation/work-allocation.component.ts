import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { FeatureFlags, LaunchDarklyService } from '../services/launch-darkly.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-work-allocation',
    templateUrl: './work-allocation.component.html',
    styleUrls: ['./work-allocation.component.scss']
})
export class WorkAllocationComponent implements OnInit, OnDestroy {
    public isVhTeamLeader = false;

    dom1FeatureEnabled = false;
    showSaveConfirmation = false;
    dataChangedBroadcast = new EventEmitter<boolean>();

    destroyed$ = new Subject<void>();

    constructor(private userIdentityService: UserIdentityService, private launchDarklyService: LaunchDarklyService) {}

    ngOnInit() {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
        this.launchDarklyService
            .getFlag<boolean>(FeatureFlags.dom1Integration)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(flag => {
                this.dom1FeatureEnabled = flag;
            });
    }

    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
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
