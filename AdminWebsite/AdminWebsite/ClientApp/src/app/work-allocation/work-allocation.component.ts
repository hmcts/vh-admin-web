import { Component } from '@angular/core';
import { BHClient, UploadWorkHoursRequest, UserProfileResponse, WorkingHours } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { convertToNumberArray } from '../common/helpers/array-helper';
import { NonWorkingHours, UploadNonWorkHoursRequest } from './upload-non-work-hours-models';
import { FileType } from '../common/model/file-type';

@Component({
    selector: 'app-work-allocation',
    templateUrl: './work-allocation.component.html',
    styleUrls: ['./work-allocation.component.scss']
})
export class WorkAllocationComponent {
    public isWorkingHoursFileValidationErrors = false;
    public isNonWorkingHoursFileValidationErrors = false;

    public isWorkingHoursUploadComplete = false;
    public isNonWorkingHoursUploadComplete = false;
    public isVhTeamLeader = false;

    public numberOfUsernamesToUploadWorkHours = 0;
    public numberOfUsernamesToUploadNonWorkHours = 0;

    public workingHoursFileUploadUsernameErrors: string[] = [];
    public nonWorkingHoursFileValidationErrors: string[] = [];
    public workingHoursFileValidationErrors: string[] = [];

    public workingHoursFile: File | null = null;

    private csvDelimiter = ',';
    private timeDelimiter = ':';
    private earliestStartHour = 8;
    private latestEndHour = 18;

    private incorrectDelimiterErrorMessage = 'Incorrect delimiter used. Please use a colon to separate the hours and minutes.';

    maxFileUploadSize = 200000;

    constructor(private bhClient: BHClient, private userIdentityService: UserIdentityService) {
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

    handleFileInput(file: File, fileType: FileType) {
        this.resetErrors();

        if (!file) {
            return;
        }

        this.workingHoursFile = file;

        if (this.workingHoursFile.size > this.maxFileUploadSize) {
            if (fileType === FileType.UploadNonWorkingHours) {
                this.isNonWorkingHoursFileValidationErrors = true;
                this.nonWorkingHoursFileValidationErrors.push(`File cannot be larger than ${this.maxFileUploadSize / 1000}kb`);
            } else {
                this.isWorkingHoursFileValidationErrors = true;
                this.workingHoursFileValidationErrors.push(`File cannot be larger than ${this.maxFileUploadSize / 1000}kb`);
            }
        }
    }

    isDelimiterValid(time: string) {
        let isValid = true;

        const timeArray = time.split(this.timeDelimiter);

        if (timeArray.length !== 2) {
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

    isNonWorkingDayError(startTime: string, endTime: string, errorLocationMessage: string = '') {
        if (errorLocationMessage) {
            errorLocationMessage = errorLocationMessage + ' ';
        }

        if (!startTime && endTime && endTime !== '\r') {
            this.workingHoursFileValidationErrors.push(`${errorLocationMessage}Start time is blank`);
            return true;
        }

        if (startTime && (!endTime || endTime === '\r')) {
            this.workingHoursFileValidationErrors.push(`${errorLocationMessage}End time is blank`);
            return true;
        }

        return false;
    }

    resetErrors() {
        this.isWorkingHoursFileValidationErrors = false;
        this.isNonWorkingHoursFileValidationErrors = false;
        this.nonWorkingHoursFileValidationErrors = [];
        this.workingHoursFileValidationErrors = [];
    }

    readFile(file: File): FileReader {
        const reader = new FileReader();
        reader.readAsText(file);
        return reader;
    }

    readWorkAvailability(text: string) {
        this.isWorkingHoursUploadComplete = false;

        const userWorkAvailabilityRows = text.split('\n');
        // Remove headings rows
        userWorkAvailabilityRows.splice(0, 2);

        const workAvailabilities: UploadWorkHoursRequest[] = [];

        this.numberOfUsernamesToUploadWorkHours = userWorkAvailabilityRows.length;

        userWorkAvailabilityRows.forEach((row, index) => {
            const values = row.split(this.csvDelimiter);

            const uploadWorkHoursRequest = new UploadWorkHoursRequest();
            uploadWorkHoursRequest.username = values[0];

            const workingHours: WorkingHours[] = [];

            let dayOfWeekId = 0;
            let dayWorkingHours: WorkingHours;

            for (let i = 1; i < values.length; i += 2) {
                dayOfWeekId++;

                const rowNumber = index + 3;
                const entryNumber = i + 1;

                if (this.isNonWorkingDayError(values[i], values[i + 1], `Row ${rowNumber}, Entry ${entryNumber}-${entryNumber + 1} -`)) {
                    this.isWorkingHoursFileValidationErrors = true;
                    continue;
                }

                if (this.isNonWorkingDay(values[i], values[i + 1])) {
                    dayWorkingHours = new WorkingHours();
                    dayWorkingHours.day_of_week_id = dayOfWeekId;
                    workingHours.push(dayWorkingHours);
                    continue;
                }

                if (!this.isDelimiterValid(values[i])) {
                    this.isWorkingHoursFileValidationErrors = true;
                    this.workingHoursFileValidationErrors.push(
                        `Row ${rowNumber}, Entry ${entryNumber} - ${this.incorrectDelimiterErrorMessage}`
                    );
                    continue;
                }

                if (!this.isDelimiterValid(values[i + 1])) {
                    this.isWorkingHoursFileValidationErrors = true;
                    this.workingHoursFileValidationErrors.push(
                        `Row ${rowNumber}, Entry ${entryNumber + 2} - ${this.incorrectDelimiterErrorMessage}`
                    );
                    continue;
                }

                const startTimeArray = convertToNumberArray(values[i].split(this.timeDelimiter));
                const endTimeArray = convertToNumberArray(values[i + 1].split(this.timeDelimiter));

                const areDayWorkingHoursValid = this.areDayWorkingHoursValid(startTimeArray, endTimeArray, rowNumber, entryNumber);

                if (!this.isWorkingHoursFileValidationErrors) {
                    this.isWorkingHoursFileValidationErrors = !areDayWorkingHoursValid;
                }

                dayWorkingHours = {
                    day_of_week_id: dayOfWeekId,
                    start_time_hour: startTimeArray[0],
                    start_time_minutes: startTimeArray[1],
                    end_time_hour: endTimeArray[0],
                    end_time_minutes: endTimeArray[1]
                } as WorkingHours;
                workingHours.push(dayWorkingHours);
            }

            uploadWorkHoursRequest.working_hours = workingHours;
            workAvailabilities.push(uploadWorkHoursRequest);
        });

        if (this.isWorkingHoursFileValidationErrors) {
            return;
        }

        this.bhClient.uploadWorkHours(workAvailabilities).subscribe(result => {
            this.isWorkingHoursUploadComplete = true;
            this.workingHoursFileUploadUsernameErrors = result.failed_usernames;
        });
    }

    readNonWorkAvailability(text: string) {
        this.isNonWorkingHoursUploadComplete = false;

        const userNonWorkAvailabilityRows = text.split('\n');
        // Remove headings rows
        userNonWorkAvailabilityRows.splice(0, 1);

        const uploadNonWorkHoursRequests: UploadNonWorkHoursRequest[] = [];
        this.numberOfUsernamesToUploadNonWorkHours = userNonWorkAvailabilityRows.length;

        userNonWorkAvailabilityRows.forEach((row, index) => {
            const values = row.replace(/\r/g, '').split(this.csvDelimiter);

            const uploadNonWorkHoursRequest = new UploadNonWorkHoursRequest();

            const rowNumber = index + 2;
            const entryNumber = 2;

            if (!this.isDelimiterValid(values[2])) {
                this.isNonWorkingHoursFileValidationErrors = true;
                this.nonWorkingHoursFileValidationErrors.push(
                    `Row ${rowNumber}, Entry ${entryNumber} - ${this.incorrectDelimiterErrorMessage}`
                );
                return;
            }

            if (!this.isDelimiterValid(values[4])) {
                this.isNonWorkingHoursFileValidationErrors = true;
                this.nonWorkingHoursFileValidationErrors.push(
                    `Row ${rowNumber}, Entry ${entryNumber + 2} - ${this.incorrectDelimiterErrorMessage}`
                );
                return;
            }

            const startDate = new Date(`${values[1]}T${values[2]}`);
            const endDate = new Date(`${values[3]}T${values[4]}`);

            if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
                this.isNonWorkingHoursFileValidationErrors = true;
                this.nonWorkingHoursFileValidationErrors.push(`Row ${rowNumber} - Contains an invalid date`);
            }

            if (endDate < startDate) {
                this.isNonWorkingHoursFileValidationErrors = true;
                this.nonWorkingHoursFileValidationErrors.push(`Row ${rowNumber} - End date time is before start date time`);
            }

            if (this.isNonWorkingHoursFileValidationErrors) {
                return;
            }

            const nonWorkingHours: NonWorkingHours = {
                end_date_time: endDate,
                start_date_time: startDate
            };

            uploadNonWorkHoursRequest.non_working_hours = nonWorkingHours;
            uploadNonWorkHoursRequest.username = values[0];
            uploadNonWorkHoursRequests.push(uploadNonWorkHoursRequest);
        });

        // Here for sonarcloud. To be removed in follow up stories
        console.log('Arif', uploadNonWorkHoursRequests);
    }

    uploadWorkingHours() {
        this.resetErrors();

        if (!this.workingHoursFile) {
            return;
        }

        const reader = this.readFile(this.workingHoursFile);
        reader.onload = e => this.readWorkAvailability(e.target.result as string);
    }

    uploadNonWorkingHours() {
        this.resetErrors();

        // TODO this file variable name should be agnostic of file type
        // if this comment remains in PR please flag :(
        if (!this.workingHoursFile) {
            return;
        }

        const reader = this.readFile(this.workingHoursFile);
        reader.onload = e => this.readNonWorkAvailability(e.target.result as string);
    }

    validateTimeCell(timeCell: number[], errorLocationMessage: string = ''): boolean {
        const hour = timeCell[0];
        const minutes = timeCell[1];

        if (errorLocationMessage) {
            errorLocationMessage = errorLocationMessage + ' ';
        }

        let hasError = false;
        if (isNaN(hour) || isNaN(minutes)) {
            this.workingHoursFileValidationErrors.push(`${errorLocationMessage}Value is not a valid time`);
            hasError = true;
        } else {
            if (hour < this.earliestStartHour || hour > this.latestEndHour) {
                this.workingHoursFileValidationErrors.push(
                    `${errorLocationMessage}Hour value (${hour}) is not within 0${this.earliestStartHour}:00 - ${this.latestEndHour}:00`
                );
                hasError = true;
            }

            if (minutes < 0 || minutes > 59) {
                this.workingHoursFileValidationErrors.push(`${errorLocationMessage}Minutes value (${minutes}) is not within 0-59`);
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
        errorLocationMessage: string = ''
    ) {
        if (errorLocationMessage) {
            errorLocationMessage = errorLocationMessage + ' ';
        }

        if (endTimeHour < startTimeHour || (endTimeHour === startTimeHour && endTimeMinute < startTimeMinute)) {
            const startTime = `${startTimeHour}:${startTimeMinute === 0 ? '00' : startTimeMinute}`;
            const endTime = `${endTimeHour}:${endTimeMinute === 0 ? '00' : endTimeMinute}`;

            this.workingHoursFileValidationErrors.push(`${errorLocationMessage}End time ${endTime} is before start time ${startTime}`);

            return false;
        }

        return true;
    }
}
