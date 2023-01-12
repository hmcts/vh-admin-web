import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BHClient } from 'src/app/services/clients/api-client';

import { WorkHoursFileProcessorService } from './work-hours-file-processor.service';

describe('WorkHoursFileProcessorService', () => {
    let service: WorkHoursFileProcessorService;

    let bHClientSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['uploadWorkHours', 'uploadNonWorkingHours']);
        bHClientSpy.uploadWorkHours.and.returnValue(of({ failed_usernames: [] }));
        bHClientSpy.uploadNonWorkingHours.and.returnValue(of({ failed_usernames: [] }));

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

        it('should show non-working hours file upload formatting errors', () => {
            const input =
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                'first.second@xyz.com,2022-01-01,10#00,2022-01-07,17:00\n' +
                'first.second2@xyz.com,2022-01-01,10:100,2022-01-07,17:00';

            const result = service.processWorkHours(input);

            expect(result.fileValidationErrors.length).toBeGreaterThan(0);
            expect(result.fileValidationErrors[0]).toContain('Incorrect delimiter used');
        });

        it('should successfully parse valid input', () => {
            const input =
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,';

            const result = service.processWorkHours(input);
            console.log(result);
            expect(result.fileValidationErrors.length).toBe(0);
            expect(result.numberOfUserNameToUpload).toBe(2);
            expect(result.uploadWorkHoursRequest[0].username).toBe('first.second@xyz.com');
            expect(result.uploadWorkHoursRequest[0].working_hours.length).toBe(7);
            expect(result.uploadWorkHoursRequest[1].username).toBe('first.second.2@xyz.com');
            expect(result.uploadWorkHoursRequest[1].working_hours.length).toBe(7);
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
        it('should return false when incorrect delimeter is used in working hours file', () => {
            const rowNumber = 2;
            const entryNumber = 3;

            const result = service.isDelimiterValid('0900');

            expect(result).toBeFalsy();
        });

        it('should return true when correct delimeter is used', () => {
            const rowNumber = 2;
            const entryNumber = 3;

            const result = service.isDelimiterValid('09:00');

            expect(result).toBeTruthy();
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
});
