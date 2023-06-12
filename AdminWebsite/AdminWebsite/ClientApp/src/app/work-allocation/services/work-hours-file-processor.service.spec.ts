import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import {
    BHClient,
    UploadWorkHoursRequest,
    UploadNonWorkingHoursRequest,
    WorkingHours,
    UploadWorkHoursResponse
} from 'src/app/services/clients/api-client';

import { WorkHoursFileProcessorService } from './work-hours-file-processor.service';

describe('WorkHoursFileProcessorService', () => {
    let service: WorkHoursFileProcessorService;

    let bHClientSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['uploadWorkHours', 'uploadNonWorkingHours']);
        bHClientSpy.uploadWorkHours.and.returnValue(of(new UploadWorkHoursResponse({ failed_usernames: [] })));
        bHClientSpy.uploadNonWorkingHours.and.returnValue(of(new UploadWorkHoursResponse({ failed_usernames: [] })));

        TestBed.configureTestingModule({
            providers: [{ provide: BHClient, useValue: bHClientSpy }]
        });
        service = TestBed.inject(WorkHoursFileProcessorService);
    });

    describe('processWorkHours', () => {
        it('should return error when input is invalid', () => {
            const input =
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                'first.second@xyz.com,19:00,a7:00,0900,17:30,17:30,08:00,09:60,17:-01,09:00,,,,,';

            const result = service.processWorkHours(input);

            expect(result.fileValidationErrors.length).toBeGreaterThan(0);
            expect(result.fileValidationErrors[0]).toBe(
                'Row 3, Entry 4 - Incorrect delimiter used. Please use a colon to separate the hours and minutes.'
            );
            expect(result.fileValidationErrors[1]).toBe('Row 3, Entry 10-11 - End time is blank');

            expect(result.numberOfUserNameToUpload).toBe(1);
        });

        it('should successfully parse valid input', () => {
            const input =
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday,,,\n' +
                ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                'first.second@xyz.com,10:00,17:00,09:00,17:30,08:00,17:30,09:00,17:00,09:00,17:00,,,,\n' +
                'first.second.2@xyz.com,10:00,17:00,09:00,17:30,08:00,17:30,09:00,17:00,09:00,17:00,,,,';

            const result = service.processWorkHours(input);
            expect(result.fileValidationErrors.length).toBe(0);
            expect(result.numberOfUserNameToUpload).toBe(2);
            expect(result.uploadWorkHoursRequest[0].username).toBe('first.second@xyz.com');
            expect(result.uploadWorkHoursRequest[0].working_hours.length).toBe(7);
            expect(result.uploadWorkHoursRequest[1].username).toBe('first.second.2@xyz.com');
            expect(result.uploadWorkHoursRequest[1].working_hours.length).toBe(7);
        });

        it('should remove empty rows', () => {
            const input =
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,,Saturday,,Sunday,\n' +
                ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                'first.second.1@xyz.com,10:00,17:00,09:00,17:30,08:00,17:30,09:00,17:00,09:00,17:00,,,,\n' +
                ',,,,,,,,,,,,,,\n' +
                'first.second.2@xyz.com,10:00,17:00,09:00,17:30,08:00,17:30,09:00,17:00,09:00,17:00,,,,\n' +
                '\n';

            const result = service.processWorkHours(input);

            expect(result.fileValidationErrors.length).toBe(0);
            expect(result.numberOfUserNameToUpload).toBe(2);
            expect(result.uploadWorkHoursRequest[0].username).toBe('first.second.1@xyz.com');
            expect(result.uploadWorkHoursRequest[0].working_hours.length).toBe(7);
            expect(result.uploadWorkHoursRequest[1].username).toBe('first.second.2@xyz.com');
        });

        it('show duplicate user errors', () => {
            const input =
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,';

            const result = service.processWorkHours(input);
            expect(result.fileValidationErrors.length).toBe(1);
            expect(result.fileValidationErrors[0]).toContain('duplicate team member found');
        });
    });

    describe('processNonWorkHour', () => {
        it('should show non-working hours file upload formatting errors', () => {
            const input =
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                'invalid.delimeter1@xyz.com,2022-01-01,10#00,2022-01-07,17:00\n' +
                'invalid.delimeter2@xyz.com,2022-01-01,10:100,2022-01-07,17#00\n' +
                'invalid.date@xyz.com,2022-01-01,a0:00,2022-01-07,17:00\n' +
                'enddatebefore.startdate@xyz.com,2022-02-01,10:00,2022-01-07,09:00';

            const result = service.processNonWorkHours(input);

            expect(result.fileValidationErrors.length).toBe(4);
            expect(result.fileValidationErrors[0]).toContain('Incorrect delimiter used');
            expect(result.fileValidationErrors[1]).toContain('Incorrect delimiter used');
            expect(result.fileValidationErrors[2]).toContain('Contains an invalid date');
            expect(result.fileValidationErrors[3]).toContain('End date time is before start date time');
        });

        it('should succesfully parse valid input', () => {
            const input =
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                'first.second2@xyz.com,2022-01-01,10:00,2022-01-07,17:00';

            const result = service.processNonWorkHours(input);
            expect(result.fileValidationErrors.length).toBe(0);
        });

        it('should succesfully parse valid input with DD/MM/YYYY date format', () => {
            const input =
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                'manual.vhoteamlead1@hearings.reform.hmcts.net,01/01/2023,10:00,01/01/2023,17:00\n' +
                'first.second2@xyz.com,02/01/2023,10:00,02/01/2023,17:00';

            const result = service.processNonWorkHours(input);
            expect(result.fileValidationErrors.length).toBe(0);
        });

        it('should show non-working hours file upload date errors', () => {
            const input =
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                'invalid.date@xyz.com,2023-25-01,10:00,2023-25-01,17:00';

            const result = service.processNonWorkHours(input);

            expect(result.fileValidationErrors.length).toBe(1);
            expect(result.fileValidationErrors[0]).toContain('Contains an invalid date');
        });

        it('should not parse empty row in non-working hours file upload', () => {
            const input =
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                'first.second2@xyz.com,2022-01-01,10:00,2022-01-07,17:00\n' +
                '     ';

            const result = service.processNonWorkHours(input);
            expect(result.fileValidationErrors.length).toBe(0);
        });
    });

    describe('validateDayWorkingHours', () => {
        it('should validate start time', () => {
            const startTimeArray = [10, 0];
            const endTimeArray = [17, 0];
            const rowNumber = 2;
            const entryNumber = 3;

            const validateSpy = spyOn(service, 'validateTimeCell');

            service.validateDayWorkingHours(startTimeArray, endTimeArray, rowNumber, entryNumber);

            expect(validateSpy).toHaveBeenCalledWith(startTimeArray, `Row ${rowNumber}, Entry ${entryNumber} -`);
        });

        it('should validate end time', () => {
            const startTimeArray = [10, 0];
            const endTimeArray = [17, 0];
            const rowNumber = 2;
            const entryNumber = 3;

            const validateSpy = spyOn(service, 'validateTimeCell');

            service.validateDayWorkingHours(startTimeArray, endTimeArray, rowNumber, entryNumber);

            expect(validateSpy).toHaveBeenCalledWith(startTimeArray, `Row ${rowNumber}, Entry ${entryNumber} -`);
        });

        it('should validate start time is before end time', () => {
            const startTimeArray = [10, 0];
            const endTimeArray = [17, 0];
            const rowNumber = 2;
            const entryNumber = 3;

            const validateSpy = spyOn(service, 'validateStartTimeBeforeEndTime');

            service.validateDayWorkingHours(startTimeArray, endTimeArray, rowNumber, entryNumber);

            expect(validateSpy).toHaveBeenCalledWith(
                startTimeArray[0],
                startTimeArray[1],
                endTimeArray[0],
                endTimeArray[1],
                `Row ${rowNumber}, Entry ${entryNumber}-${entryNumber + 1} -`
            );
        });
    });

    describe('isDelimiterValid', () => {
        it('should return false when delimeter is not used in working hours file', () => {
            expect(service.isDelimiterValid('0900')).toBeFalsy();
        });

        it('should return false when input is undefined', () => {
            const result = service.isDelimiterValid(undefined);

            expect(result).toBeFalsy();
        });

        it('should return true when correct delimeter is used', () => {
            const result = service.isDelimiterValid('09:00');
            expect(result).toBeTruthy();
            expect(service.isDelimiterValid('09:00')).toBeTruthy();
        });
    });

    describe('isNonWorkingDay', () => {
        it('should return true when start time and end time are blank', () => {
            const endTimes = ['', '\r'];

            endTimes.forEach((endTime: string) => {
                const result = service.isNonWorkingDay('', endTime);
                expect(result).toBeTruthy();
            });
        });

        it('should return false when start time and end time are populated', () => {
            const result = service.isNonWorkingDay('09:00', '17:30');
            expect(result).toBeFalsy();
        });
    });

    describe('isNonWorkingDayError', () => {
        const testCases = [
            { case: 'start time is blank and end time is not', startTime: '', endTime: '17:00', errorMessage: 'Start time is blank' },
            { case: 'start time is not blank and end time is', startTime: '09:00', endTime: '', errorMessage: 'End time is blank' },
            {
                case: 'start time is not blank and end time is end of line',
                startTime: '09:00',
                endTime: '\r',
                errorMessage: 'End time is blank'
            }
        ];

        testCases.forEach(testCase => {
            it(`should return true and add error message when ${testCase.case}`, () => {
                const [isError, error] = service.isNonWorkingDayError(testCase.startTime, testCase.endTime);

                expect(isError).toBeTruthy();
                expect(error).toBe(testCase.errorMessage);
            });
        });

        it('should add space to passed in error message', () => {
            const [isError, error] = service.isNonWorkingDayError('', '17:30', 'Location -');

            expect(isError).toBeTruthy();
            expect(error).toBe('Location - Start time is blank');
        });
    });

    describe('isFileTooBig', () => {
        it('should return true when file size exceeds max size limit', () => {
            const file = new File([''], 'filename', { type: 'text/csv' });
            Object.defineProperty(file, 'size', { value: 2000001 });

            const result = service.isFileTooBig(file);

            expect(result).toBeTruthy();
        });

        it('should return false when file size is below the max size limit', () => {
            const file = new File([''], 'filename', { type: 'text/csv' });
            Object.defineProperty(file, 'size', { value: 19999 });

            const result = service.isFileTooBig(file);

            expect(result).toBeFalsy();
        });
    });

    describe('isFileFormatValild', () => {
        it('should return true when file extension is valid', () => {
            const file = new File([''], 'filename.csv', { type: 'text/csv' });

            const result = service.isFileFormatValild(file);

            expect(result).toBeTruthy();
        });

        it('should return false when file extension is not csv', () => {
            const file = new File([''], 'filename.xls', { type: 'application/vnd.ms-excel' });

            const result = service.isFileFormatValild(file);

            expect(result).toBeFalsy();
        });
    });

    describe('validateTimeCell', () => {
        const testCases = [
            { case: 'hour is not a number', timeCell: [NaN, 30], errorMessage: 'Value is not a valid time' },
            { case: 'minute is not a number', timeCell: [9, NaN], errorMessage: 'Value is not a valid time' },
            { case: 'hour is before work hours', timeCell: [7, 30], errorMessage: 'Hour value (7) is not within 08:00 - 18:00' },
            { case: 'hour is after work hours', timeCell: [19, 30], errorMessage: 'Hour value (19) is not within 08:00 - 18:00' },
            { case: 'minute is above 59', timeCell: [9, -1], errorMessage: 'Minutes value (-1) is not within 0-59' },
            { case: 'minute is below 0', timeCell: [9, 60], errorMessage: 'Minutes value (60) is not within 0-59' }
        ];

        testCases.forEach(testCase => {
            it(`should return false and add error message when ${testCase.case}`, () => {
                const [isValid, error] = service.validateTimeCell(testCase.timeCell, '');

                expect(isValid).toBeFalsy();
                expect(error).toBe(testCase.errorMessage);
            });
        });

        it('should add space to passed in error message', () => {
            const [isValid, error] = service.validateTimeCell([NaN, 30], 'Location -');

            expect(isValid).toBeFalsy();
            expect(error).toBe('Location - Value is not a valid time');
        });

        it('should return true with no error message', () => {
            const [isValid, error] = service.validateTimeCell([9, 30], 'Location -');

            expect(isValid).toBeTruthy();
            expect(error).toBeUndefined();
        });
    });

    describe('validateStartTimeBeforeEndTime', () => {
        const testCases = [
            { startTimeHour: 11, startTimeMinute: 0, endTimeHour: 9, endTimeMinute: 0 },
            { startTimeHour: 11, startTimeMinute: 0, endTimeHour: 9, endTimeMinute: 30 },
            { startTimeHour: 12, startTimeMinute: 30, endTimeHour: 12, endTimeMinute: 20 }
        ];

        testCases.forEach(testCase => {
            it(`should return false and add error message when end time is before start time`, () => {
                const startTime = `${testCase.startTimeHour}:${testCase.startTimeMinute === 0 ? '00' : testCase.startTimeMinute}`;
                const endTime = `${testCase.endTimeHour}:${testCase.endTimeMinute === 0 ? '00' : testCase.endTimeMinute}`;

                const [isValid, error] = service.validateStartTimeBeforeEndTime(
                    testCase.startTimeHour,
                    testCase.startTimeMinute,
                    testCase.endTimeHour,
                    testCase.endTimeMinute,
                    ''
                );

                expect(isValid).toBeFalsy();
                expect(error).toBe(`End time ${endTime} is before start time ${startTime}`);
            });
        });

        it('should add space to passed in error message', () => {
            const startTime = '11:00';
            const endTime = '9:00';

            const [isValid, error] = service.validateStartTimeBeforeEndTime(11, 0, 9, 0, 'Location -');

            expect(isValid).toBeFalsy();
            expect(error).toBe(`Location - End time ${endTime} is before start time ${startTime}`);
        });

        it('should return true with no error message', () => {
            const [isValid, error] = service.validateStartTimeBeforeEndTime(9, 0, 17, 0, 'Location -');

            expect(isValid).toBeTruthy();
            expect(error).toBeUndefined();
        });
    });

    describe('calling the API', () => {
        it('should call the api to upload work hours', waitForAsync(() => {
            const requests: UploadWorkHoursRequest[] = [
                new UploadWorkHoursRequest({
                    username: 'spoc@test.com',
                    working_hours: [
                        new WorkingHours({
                            day_of_week_id: 1,
                            start_time_hour: 10,
                            start_time_minutes: 0,
                            end_time_hour: 15,
                            end_time_minutes: 0
                        })
                    ]
                })
            ];

            service.uploadWorkingHours(requests).subscribe(result => {
                expect(result.failed_usernames.length).toBe(0);
            });
        }));

        it('should call the api to upload non-work hours', waitForAsync(() => {
            const requests: UploadNonWorkingHoursRequest[] = [
                new UploadNonWorkingHoursRequest({
                    username: 'john@doe.com',
                    start_time: new Date(2023, 1, 1, 10, 30, 0, 0),
                    end_time: new Date(2023, 1, 5, 10, 30, 0, 0)
                })
            ];

            service.uploadNonWorkingHours(requests).subscribe(result => {
                expect(result.failed_usernames.length).toBe(0);
            });
        }));
    });

    describe('check for duplicate users', () => {
        it('should return validation error when duplicate username is found', () => {
            const input =
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                'first.second@xyz.com,10:00,17:00,11:00,17:30,12:30,18:00,13:00,18:00,14:00,17:00,,,,\n' +
                'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,';
            const rows = input.split('\n');
            const userWorkAvailabilityRowsSplit = rows.map(x => x.split(','));
            const result = service.checkWorkAvailabilityForDuplicateUsers(userWorkAvailabilityRowsSplit);

            expect(result[0]).toBe('first.second@xyz.com - Multiple entries for user. Only one row per user required');
        });
    });
});
