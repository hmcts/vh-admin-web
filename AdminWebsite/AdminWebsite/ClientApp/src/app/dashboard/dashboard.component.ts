import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, combineLatest, lastValueFrom, takeUntil } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../services/launch-darkly.service';
import { Logger } from '../services/logger';
import { UserIdentityService } from '../services/user-identity.service';
import { faUsers, faShuffle, faPenToSquare, faLock, faRotateRight, faVolumeOff, faCircle } from '@fortawesome/free-solid-svg-icons';
import { faCalendarCheck, faCircleUser } from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[Dashboard] -';
    constructor(
        private readonly launchDarklyService: LaunchDarklyService,
        private readonly userIdentityService: UserIdentityService,

        private readonly logger: Logger
    ) {}

    manageTeamIcon = faUsers;
    bookHearingIcon = faCalendarCheck;
    manageWorkAllocationIcon = faShuffle;
    editParticipantNameIcon = faPenToSquare;

    changePasswordBackIcon = faRotateRight;
    changePasswordFrontIcon = faLock;

    getAudioIconBack = faCircle;
    getAudioIconFront = faVolumeOff;

    deleteUserIcon = faCircleUser;

    showCheckList = false;
    showBooking = false;
    showWorkAllocation = false;
    dom1Feature = false;
    audioSearchFeature: boolean;

    showManageTeam = false;
    showAudioFileLink = false;

    destroyed$ = new Subject<void>();

    ngOnInit() {
        const audioSearchFlag$ = this.launchDarklyService.getFlag<boolean>(FeatureFlags.audioSearch).pipe(takeUntil(this.destroyed$));
        const dom1FeatureFlag$ = this.launchDarklyService.getFlag<boolean>(FeatureFlags.dom1Integration).pipe(takeUntil(this.destroyed$));

        combineLatest([audioSearchFlag$, dom1FeatureFlag$]).subscribe(([audioSearchFlag, dom1FeatureFlag]) => {
            this.audioSearchFeature = audioSearchFlag;
            this.dom1Feature = dom1FeatureFlag;
            lastValueFrom(this.userIdentityService.getUserInformation()).then(profile => {
                this.showCheckList = profile.is_vh_officer_administrator_role;
                this.showWorkAllocation = profile.is_vh_team_leader;
                this.showAudioFileLink = this.showCheckList && !this.audioSearchFeature;
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
