import { Component } from '@angular/core';
import { DayWorkingHours } from '../common/model/day-working-hours'
import { WorkAvailability } from '../common/model/work-availability'
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
            return;
        };
    }

    //  TODO: Test
    uploadWorkingHours() {
        if (!this.workingHoursFile) {
            return;
        }

        this.readWorkAvailability(this.workingHoursFile);
    }

    //  TODO: Test
    readWorkAvailability(file: File) {
        const reader = new FileReader();
        reader.readAsText(file);
        
        reader.onload = function (e) {
            const text = e.target.result as string;
            const delimiter = ',';

            let userWorkAvailabilityRows = text.split("\n");
            // Remove headings rows
            userWorkAvailabilityRows.splice(0, 2);

            const workAvailabilities: WorkAvailability[] = [];

            userWorkAvailabilityRows.forEach((row, index) => {
                const values = row.split(delimiter);

                const workAvailability = new WorkAvailability();
                workAvailability.username = values[0];

                const workingHours: DayWorkingHours[] = [];

                let dayOfWeekId = 1;

                for (let i = 1; i < values.length; i++) {
                    let dayWorkingHours = new DayWorkingHours();
                    
                    const startTimeArray = values[i].split(':');
                    const endTimeArray = values[++i].split(':');
                    
                    dayWorkingHours.dayOfWeekId = dayOfWeekId++;
                    dayWorkingHours.startTimeHour = parseInt(startTimeArray[0]);
                    dayWorkingHours.startTimeMinutes = parseInt(startTimeArray[1]);
                    dayWorkingHours.endTimeHour = parseInt(endTimeArray[0]);
                    dayWorkingHours.endTimeMinutes = parseInt(endTimeArray[1]);
                    workingHours.push(dayWorkingHours);
                }
    
                workAvailability.workingHours = workingHours;
                workAvailabilities.push(workAvailability);
            });


            console.log('Arif', workAvailabilities);
        };
    }
}
