import { Component } from '@angular/core';
import { DayWorkingHours } from '../common/model/day-working-hours'
import { WorkAvailability } from '../common/model/work-availability'
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { convertToNumberArray } from '../common/helpers/array-helpers';

@Component({
    selector: 'app-work-allocation',
    templateUrl: './work-allocation.component.html',
    styleUrls: ['./work-allocation.component.scss']
})

export class WorkAllocationComponent {
    public isWorkingHoursFileUploadError = false;
    public isVhTeamLeader = false;

    public workingHoursFileUploadErrors: string[] = [];

    public workingHoursFile: File | null = null;

    maxFileUploadSize = 200000;

    constructor(private userIdentityService: UserIdentityService) {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
    }

    handleFileInput(file: File) {
        this.resetErrors();

        if (!file) {
            return;
        }

        this.workingHoursFile = file;

        if (this.workingHoursFile.size > this.maxFileUploadSize) {
            this.isWorkingHoursFileUploadError = true;
            this.workingHoursFileUploadErrors.push(`File cannot be larger than ${this.maxFileUploadSize / 1000}kb`);
            return;
        };
    }

    resetErrors() {
        this.isWorkingHoursFileUploadError = false;
        this.workingHoursFileUploadErrors = [];
    }

    //  TODO: Test
    readFile(file: File) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (e) => this.readWorkAvailability(e.target.result as string);
    }

    //  TODO: Test
    readWorkAvailability(text: string): any {
        const delimiter = ',';
        const timeDelimiter = ':';

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

                const rowNumber = index + 3;
                const entryNumber = i + 1;
                
                const startTimeArray = convertToNumberArray(values[i].split(timeDelimiter));
                const endTimeArray = convertToNumberArray(values[i + 1].split(timeDelimiter));

                let isDelimiterError = false;
                [startTimeArray, endTimeArray].forEach((array, arrayIndex) => {
                    if (array.length !== 2) {
                        this.isWorkingHoursFileUploadError = isDelimiterError = true;
                        this.workingHoursFileUploadErrors.push(`Row ${rowNumber}, Entry: ${entryNumber + arrayIndex} - Incorrect delimiter used. Please use a colon to separate the hours and minutes.`);
                    }
                    return;
                })

                if (isDelimiterError) {
                    i++;
                    continue;
                }
                
                const isStartTimeCellValid =
                    this.validateTimeCell(startTimeArray, `Row ${rowNumber}, Entry: ${entryNumber} -`);
                const isEndTimeCellValid =
                    this.validateTimeCell(endTimeArray, `Row ${rowNumber}, Entry: ${entryNumber + 1} -`);
                
                const isStartTimeBeforeEndTime = this.validateStartTimeBeforeEndTime(
                    startTimeArray[0],
                    startTimeArray[1],
                    endTimeArray[0],
                    endTimeArray[1],
                    `Row ${rowNumber}, Entry: ${entryNumber}-${entryNumber + 1} -`
                );
                                
                if (!this.isWorkingHoursFileUploadError) {
                    this.isWorkingHoursFileUploadError =
                        !isStartTimeCellValid || !isEndTimeCellValid || !isStartTimeBeforeEndTime;
                }
                
                if (!this.isWorkingHoursFileUploadError) {
                    dayWorkingHours.dayOfWeekId = dayOfWeekId++;
                    dayWorkingHours.startTimeHour = startTimeArray[0];
                    dayWorkingHours.startTimeMinutes = startTimeArray[1];
                    dayWorkingHours.endTimeHour = endTimeArray[0];
                    dayWorkingHours.endTimeMinutes = endTimeArray[1];
                    workingHours.push(dayWorkingHours);
                }

                i++
            }

            workAvailability.workingHours = workingHours;
            workAvailabilities.push(workAvailability);
        });
    }

    uploadWorkingHours() {
        this.resetErrors();

        if (!this.workingHoursFile) {
            return;
        }

        this.readFile(this.workingHoursFile);
    }

    validateTimeCell(timeCell: number[], errorLocationMessaage: string = ''): boolean {
        const hour = timeCell[0];
        const minutes = timeCell[1];

        if (errorLocationMessaage) {
            errorLocationMessaage = errorLocationMessaage + ' ';
        }

        let hasError = false;
        if (isNaN(hour) || isNaN(minutes)) {
            this.workingHoursFileUploadErrors.push(`${errorLocationMessaage}Value is not a valid time`);
            hasError = true;
        } else {
            if (hour < 9 || hour > 17) {
                this.workingHoursFileUploadErrors.push(`${errorLocationMessaage}Hour value (${hour}) is not within 08:00 - 18:00`);
                hasError = true;
            }
            
            if (minutes < 0 || minutes > 59) {
                this.workingHoursFileUploadErrors.push(`${errorLocationMessaage}Minutes value (${minutes}) is not within 0-59`);
                hasError = true;
            }
        }

        return !hasError;
    }

    validateStartTimeBeforeEndTime(
        startTimeHour: number,
        startTimeMinute: number,
        endTimeHour: number,
        endTimeMinute: number,
        errorLocationMessaage: string = ''
    ) {
        if (errorLocationMessaage) {
            errorLocationMessaage = errorLocationMessaage + ' ';
        }

        if ((endTimeHour < startTimeHour) ||
            (endTimeHour === startTimeHour && endTimeMinute < startTimeMinute)) {
            const startTime = `${startTimeHour}:${startTimeMinute == 0 ? '00' : startTimeMinute}`;
            const endTime = `${endTimeHour}:${endTimeMinute == 0 ? '00' : endTimeMinute}`;
            
            this.workingHoursFileUploadErrors
                .push(`${errorLocationMessaage}End time ${endTime} is before start time ${startTime}`);

            return false; 
        }

        return true;
    }
}
