import { Component } from '@angular/core';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';

@Component({
    selector: 'app-work-allocation',
    templateUrl: './work-allocation.component.html',
    styleUrls: ['./work-allocation.component.scss']
})
export class WorkAllocationComponent {
    public isWorkingHoursFileUploadError = false;
    public isVhTeamLeader = false;

    public workingHoursFileUploadError = '';

    public workingHoursFile: File | null = null;

    maxFileUploadSize = 200000;

    constructor(private userIdentityService: UserIdentityService) {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
    }

    handleFileInput(file: File) {
        this.isWorkingHoursFileUploadError = false;
        this.workingHoursFileUploadError = '';
 
        this.workingHoursFile = file;

        if (this.workingHoursFile.size > this.maxFileUploadSize) {
            this.isWorkingHoursFileUploadError = true;
            this.workingHoursFileUploadError = `File cannot be larger than ${this.maxFileUploadSize / 1000}kb`;
         };
    }
}
