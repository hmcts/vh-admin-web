import { Component } from '@angular/core';
import { DayWorkingHours } from '../common/model/day-working-hours';
import { WorkAvailability } from '../common/model/work-availability';
import { UserProfileResponse } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { convertToNumberArray } from '../common/helpers/array-helper';

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

    private timeDelimiter = ':';
    private earliestStartHour = 8;
    private latestEndHour = 18;

    maxFileUploadSize = 200000;

    constructor(private userIdentityService: UserIdentityService) {
        this.userIdentityService.getUserInformation().subscribe((userProfileResponse: UserProfileResponse) => {
            this.isVhTeamLeader = userProfileResponse.is_vh_team_leader;
        });
    }

    areDayWorkingHoursValid(startTimeArray: number[], endTimeArray: number[], rowNumber: number, entryNumber: number) {
        const isStartTimeCellValid = this.validateTimeCell(startTimeArray, `Row ${rowNumber}, Entry ${entryNumber} -`);
        const isEndTimeCellValid = this.validateTimeCell(endTimeArray, `Row ${rowNumber}, Entry ${entryNumber + 1} -`);

        const isStartTimeBeforeEndTime = this.validateStartTimeBeforeEndTime(
            startTimeArray[0],
            startTimeArray[1],
            endTimeArray[0],
            endTimeArray[1],
            `Row ${rowNumber}, Entry ${entryNumber}-${entryNumber + 1} -`
        );

        return isStartTimeCellValid && isEndTimeCellValid && isStartTimeBeforeEndTime;
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
        }
    }

    isDelimiterValid(time: string, rowNumber: number, entryNumber: number) {
        let isValid = true;

        const timeArray = time.split(this.timeDelimiter);

        if (timeArray.length !== 2) {
            this.workingHoursFileUploadErrors.push(
                `Row ${rowNumber}, Entry ${entryNumber} - Incorrect delimiter used. Please use a colon to separate the hours and minutes.`
            );
            isValid = false;
        }

        return isValid;
    }

    isNonWorkingDay(startTime: string, endTime: string) {
        if (!startTime && (!endTime || endTime === '\r')) {
            return true;
        }

        return false;
    }

    isNonWorkingDayError(startTime: string, endTime: string, errorLocationMessaage: string = '') {
        if (errorLocationMessaage) {
            errorLocationMessaage = errorLocationMessaage + ' ';
        }

        if (!startTime && endTime && endTime !== '\r') {
            this.workingHoursFileUploadErrors.push(`${errorLocationMessaage}Start time is blank`);
            return true;
        }

        if (startTime && (!endTime || endTime === '\r')) {
            this.workingHoursFileUploadErrors.push(`${errorLocationMessaage}End time is blank`);
            return true;
        }

        return false;
    }

    resetErrors() {
        this.isWorkingHoursFileUploadError = false;
        this.workingHoursFileUploadErrors = [];
    }

    readFile(file: File) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = e => this.readWorkAvailability(e.target.result as string);
    }

    readWorkAvailability(text: string): any {
        const delimiter = ',';

        const userWorkAvailabilityRows = text.split('\n');
        // Remove headings rows
        userWorkAvailabilityRows.splice(0, 2);

        const workAvailabilities: WorkAvailability[] = [];

        userWorkAvailabilityRows.forEach((row, index) => {
            const values = row.split(delimiter);

            const workAvailability = new WorkAvailability();
            workAvailability.username = values[0];

            const workingHours: DayWorkingHours[] = [];

            let dayOfWeekId = 0;
            let dayWorkingHours: DayWorkingHours;

            for (let i = 1; i < values.length; i++) {
                dayOfWeekId++;

                const rowNumber = index + 3;
                const entryNumber = i + 1;

                if (this.isNonWorkingDayError(values[i], values[i + 1], `Row ${rowNumber}, Entry ${entryNumber}-${entryNumber + 1} -`)) {
                    this.isWorkingHoursFileUploadError = true;
                    i++;
                    continue;
                }

                if (this.isNonWorkingDay(values[i], values[i + 1])) {
                    dayWorkingHours = new DayWorkingHours(dayOfWeekId);
                    workingHours.push(dayWorkingHours);
                    i++;
                    continue;
                }

                if (
                    !this.isDelimiterValid(values[i], rowNumber, entryNumber) ||
                    !this.isDelimiterValid(values[i + 1], rowNumber, entryNumber + 1)
                ) {
                    i++;
                    continue;
                }

                const startTimeArray = convertToNumberArray(values[i].split(this.timeDelimiter));
                const endTimeArray = convertToNumberArray(values[i + 1].split(this.timeDelimiter));

                const areDayWorkingHoursValid = this.areDayWorkingHoursValid(startTimeArray, endTimeArray, rowNumber, entryNumber);

                if (!this.isWorkingHoursFileUploadError) {
                    this.isWorkingHoursFileUploadError = !areDayWorkingHoursValid;
                }

                dayWorkingHours = new DayWorkingHours(dayOfWeekId, startTimeArray[0], startTimeArray[1], endTimeArray[0], endTimeArray[1]);
                workingHours.push(dayWorkingHours);

                i++;
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
            if (hour < this.earliestStartHour || hour > this.latestEndHour) {
                this.workingHoursFileUploadErrors.push(
                    `${errorLocationMessaage}Hour value (${hour}) is not within 0${this.earliestStartHour}:00 - ${this.latestEndHour}:00`
                );
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

        if (endTimeHour < startTimeHour || (endTimeHour === startTimeHour && endTimeMinute < startTimeMinute)) {
            const startTime = `${startTimeHour}:${startTimeMinute === 0 ? '00' : startTimeMinute}`;
            const endTime = `${endTimeHour}:${endTimeMinute === 0 ? '00' : endTimeMinute}`;

            this.workingHoursFileUploadErrors.push(`${errorLocationMessaage}End time ${endTime} is before start time ${startTime}`);

            return false;
        }

        return true;
    }
}
