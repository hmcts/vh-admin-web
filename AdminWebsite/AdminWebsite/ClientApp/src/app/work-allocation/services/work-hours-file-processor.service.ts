import { Injectable } from '@angular/core';
import { BHClient, UploadNonWorkingHoursRequest, UploadWorkHoursRequest, WorkingHours } from 'src/app/services/clients/api-client';
import { convertToNumberArray } from 'src/app/common/helpers/array-helper';
import { groupBy } from 'lodash-es';

@Injectable({
    providedIn: 'root'
})
export class WorkHoursFileProcessorService {
    private csvDelimiter = ',';
    private timeDelimiter = ':';
    private earliestStartHour = 8;
    private latestEndHour = 18;
    private fileExtensionDelimiter = '.';
    private fileExtension = 'csv';
    private fileType = 'text/csv';

    maxFileUploadSize = 200000;

    private incorrectDelimiterErrorMessage = 'Incorrect delimiter used. Please use a colon to separate the hours and minutes.';
    private duplicateUserErrorMessage = 'duplicate team member found.';

    constructor(private bhClient: BHClient) {}

    processWorkHours(text: string): WorkHoursFileProcessResult {
        const userWorkAvailabilityRows = text.split('\n');

        // Remove headings rows
        userWorkAvailabilityRows.splice(0, 2);
        const workAvailabilities: UploadWorkHoursRequest[] = [];
        const workingHoursFileValidationErrors: string[] = [];

        const numberOfUsernamesToUploadWorkHours = userWorkAvailabilityRows.length;

        const userWorkAvailabilityRowsSplit = userWorkAvailabilityRows.map(x => x.split(this.csvDelimiter));
        this.checkWorkAvailabilityForDuplicateUsers(userWorkAvailabilityRowsSplit);

        const userNames: { [username: string]: number } = {};

        userWorkAvailabilityRows.forEach((row, index) => {
            const values = row.split(this.csvDelimiter);
            const actualRow = index + 3;

            const uploadWorkHoursRequest = new UploadWorkHoursRequest();
            uploadWorkHoursRequest.username = values[0];

            if (!userNames[values[0]]) {
                userNames[values[0]] = actualRow;
            } else {
                const otherRow = userNames[values[0]];
                workingHoursFileValidationErrors.push(`Row ${actualRow} & Row ${otherRow} ${this.duplicateUserErrorMessage}`);
            }

            const workingHours: WorkingHours[] = [];

            let dayOfWeekId = 0;
            let dayWorkingHours: WorkingHours;

            for (let i = 1; i < values.length; i += 2) {
                dayOfWeekId++;

                const rowNumber = index + 3;
                const entryNumber = i + 1;

                const [isNonWorkingDayError, isNonWorkingDayErrorMessage] = this.isNonWorkingDayError(
                    values[i],
                    values[i + 1],
                    `Row ${rowNumber}, Entry ${entryNumber}-${entryNumber + 1} -`
                );

                if (isNonWorkingDayError) {
                    workingHoursFileValidationErrors.push(isNonWorkingDayErrorMessage);
                    continue;
                }

                if (this.isNonWorkingDay(values[i], values[i + 1])) {
                    dayWorkingHours = new WorkingHours();
                    dayWorkingHours.day_of_week_id = dayOfWeekId;
                    dayWorkingHours.start_time_hour = null;
                    dayWorkingHours.start_time_minutes = null;
                    dayWorkingHours.end_time_hour = null;
                    dayWorkingHours.end_time_minutes = null;
                    workingHours.push(dayWorkingHours);
                    continue;
                }

                if (!this.isDelimiterValid(values[i])) {
                    workingHoursFileValidationErrors.push(
                        `Row ${rowNumber}, Entry ${entryNumber} - ${this.incorrectDelimiterErrorMessage}`
                    );
                    continue;
                }

                if (!this.isDelimiterValid(values[i + 1])) {
                    workingHoursFileValidationErrors.push(
                        `Row ${rowNumber}, Entry ${entryNumber + 2} - ${this.incorrectDelimiterErrorMessage}`
                    );
                    continue;
                }

                const startTimeArray = convertToNumberArray(values[i].split(this.timeDelimiter));
                const endTimeArray = convertToNumberArray(values[i + 1].split(this.timeDelimiter));

                this.validateDayWorkingHours(startTimeArray, endTimeArray, rowNumber, entryNumber);

                dayWorkingHours = new WorkingHours();
                dayWorkingHours.day_of_week_id = dayOfWeekId;
                dayWorkingHours.start_time_hour = startTimeArray[0];
                dayWorkingHours.start_time_minutes = startTimeArray[1];
                dayWorkingHours.end_time_hour = endTimeArray[0];
                dayWorkingHours.end_time_minutes = endTimeArray[1];
                workingHours.push(dayWorkingHours);
            }

            uploadWorkHoursRequest.working_hours = workingHours;
            workAvailabilities.push(uploadWorkHoursRequest);
        });

        const result: WorkHoursFileProcessResult = {
            numberOfUserNameToUpload: numberOfUsernamesToUploadWorkHours,
            fileValidationErrors: workingHoursFileValidationErrors,
            uploadWorkHoursRequest: workAvailabilities
        };

        return result;
    }

    processNonWorkHours(text: string): NonWorkHoursFileProcessResult {
        const userNonWorkAvailabilityRows = text.split('\n');
        // Remove headings rows
        userNonWorkAvailabilityRows.splice(0, 1);

        const uploadNonWorkHoursRequests: UploadNonWorkingHoursRequest[] = [];
        const nonWorkingHoursFileValidationErrors: string[] = [];
        const numberOfUsernamesToUploadNonWorkHours = userNonWorkAvailabilityRows.length;

        userNonWorkAvailabilityRows.forEach((row, index) => {
            const values = row.replace(/\r/g, '').split(this.csvDelimiter);

            const uploadNonWorkHoursRequest = new UploadNonWorkingHoursRequest();

            const rowNumber = index + 2;
            const entryNumber = 2;

            if (!this.isDelimiterValid(values[2])) {
                nonWorkingHoursFileValidationErrors.push(`Row ${rowNumber}, Entry ${entryNumber} - ${this.incorrectDelimiterErrorMessage}`);
                return;
            }

            if (!this.isDelimiterValid(values[4])) {
                nonWorkingHoursFileValidationErrors.push(
                    `Row ${rowNumber}, Entry ${entryNumber + 2} - ${this.incorrectDelimiterErrorMessage}`
                );
                return;
            }

            const startTime = this.parseDate(values[1], values[2]);
            const endTime = this.parseDate(values[3], values[4]);

            if (isNaN(endTime.getTime()) || isNaN(startTime.getTime())) {
                nonWorkingHoursFileValidationErrors.push(`Row ${rowNumber} - Contains an invalid date`);
            }

            if (endTime < startTime) {
                nonWorkingHoursFileValidationErrors.push(`Row ${rowNumber} - End date time is before start date time`);
            }

            if (nonWorkingHoursFileValidationErrors.length > 0) {
                return;
            }

            uploadNonWorkHoursRequest.end_time = endTime;
            uploadNonWorkHoursRequest.start_time = startTime;
            uploadNonWorkHoursRequest.username = values[0];
            uploadNonWorkHoursRequests.push(uploadNonWorkHoursRequest);
        });

        const result: NonWorkHoursFileProcessResult = {
            uploadNonWorkHoursRequest: uploadNonWorkHoursRequests,
            fileValidationErrors: nonWorkingHoursFileValidationErrors,
            numberOfUserNameToUpload: numberOfUsernamesToUploadNonWorkHours
        };
        return result;
    }

    parseDate(rawDateString: string, rawTimeString: string): Date {
        //check if date is in format DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDateString)) {
            let spiltStartDate = rawDateString.split('/');
            let day = spiltStartDate[0];
            let month = spiltStartDate[1];
            let year = spiltStartDate[2];
            var date = year + '-' + month + '-' + day;
        }
        //check if date is in format YYYY-MM-DD
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(rawDateString)) {
            var date = rawDateString;
        }
        return new Date(`${date}T${rawTimeString}`);
    }

    uploadWorkingHours(workAvailabilities: UploadWorkHoursRequest[]) {
        return this.bhClient.uploadWorkHours(workAvailabilities);
    }

    uploadNonWorkingHours(request: UploadNonWorkingHoursRequest[]) {
        return this.bhClient.uploadNonWorkingHours(request);
    }

    validateDayWorkingHours(startTimeArray: number[], endTimeArray: number[], rowNumber: number, entryNumber: number) {
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

    isFileTooBig(file: File): boolean {
        return file.size > this.maxFileUploadSize;
    }

    isDelimiterValid(time: string) {
        if (!time) {
            return false;
        }
        let isValid = true;

        try {
            const timeArray = time.split(this.timeDelimiter);

            if (timeArray.length !== 2) {
                isValid = false;
            }
        } catch {
            isValid = false;
        }

        return isValid;
    }

    readFile(file: File): FileReader {
        const reader = new FileReader();
        reader.readAsText(file);
        return reader;
    }

    checkWorkAvailabilityForDuplicateUsers(rows: Array<Array<string>>) {
        const workingHoursFileValidationErrors: string[] = [];

        const groupedByUsername = groupBy(rows, row => row[0]);

        const usernames = Object.keys(groupedByUsername);

        usernames.forEach(username => {
            const hours = groupedByUsername[username];
            if (hours.length > 1) {
                workingHoursFileValidationErrors.push(`${username} - Multiple entries for user. Only one row per user required`);
            }
        });

        return workingHoursFileValidationErrors;
    }

    isNonWorkingDay(startTime: string, endTime: string) {
        if (!startTime && (!endTime || endTime === '\r')) {
            return true;
        }

        return false;
    }

    isNonWorkingDayError(startTime: string, endTime: string, errorLocationMessage: string = ''): [boolean, string] {
        if (errorLocationMessage) {
            errorLocationMessage = errorLocationMessage + ' ';
        }

        if (!startTime && endTime && endTime !== '\r') {
            return [true, `${errorLocationMessage}Start time is blank`];
        }

        if (startTime && (!endTime || endTime === '\r')) {
            return [true, `${errorLocationMessage}End time is blank`];
        }

        return [false, undefined];
    }

    validateTimeCell(timeCell: number[], errorLocationMessage: string = ''): [boolean, string] {
        const hour = timeCell[0];
        const minutes = timeCell[1];

        if (errorLocationMessage) {
            errorLocationMessage = errorLocationMessage + ' ';
        }

        let hasError = false;
        let errorMessage: string;
        if (isNaN(hour) || isNaN(minutes)) {
            errorMessage = `${errorLocationMessage}Value is not a valid time`;
            hasError = true;
        } else {
            if (hour < this.earliestStartHour || hour > this.latestEndHour) {
                errorMessage = `${errorLocationMessage}Hour value (${hour}) is not within 0${this.earliestStartHour}:00 - ${this.latestEndHour}:00`;
                hasError = true;
            }

            if (minutes < 0 || minutes > 59) {
                errorMessage = `${errorLocationMessage}Minutes value (${minutes}) is not within 0-59`;
                hasError = true;
            }
        }

        return [!hasError, errorMessage];
    }

    validateStartTimeBeforeEndTime(
        startTimeHour: number,
        startTimeMinute: number,
        endTimeHour: number,
        endTimeMinute: number,
        errorLocationMessage: string = ''
    ): [boolean, string] {
        if (errorLocationMessage) {
            errorLocationMessage = errorLocationMessage + ' ';
        }

        if (endTimeHour < startTimeHour || (endTimeHour === startTimeHour && endTimeMinute < startTimeMinute)) {
            const startTime = `${startTimeHour}:${startTimeMinute === 0 ? '00' : startTimeMinute}`;
            const endTime = `${endTimeHour}:${endTimeMinute === 0 ? '00' : endTimeMinute}`;

            return [false, `${errorLocationMessage}End time ${endTime} is before start time ${startTime}`];
        }

        return [true, undefined];
    }

    isFileFormatValild(file: File): boolean {
        const fileNameParts = file.name.split(this.fileExtensionDelimiter);
        const extension = fileNameParts.pop().toLowerCase();
        return extension === this.fileExtension && file.type === this.fileType;
    }
}

export interface WorkHoursFileProcessResult {
    numberOfUserNameToUpload: number;
    uploadWorkHoursRequest: UploadWorkHoursRequest[];
    fileValidationErrors: string[];
}

export interface NonWorkHoursFileProcessResult {
    numberOfUserNameToUpload: number;
    uploadNonWorkHoursRequest: UploadNonWorkingHoursRequest[];
    fileValidationErrors: string[];
}
