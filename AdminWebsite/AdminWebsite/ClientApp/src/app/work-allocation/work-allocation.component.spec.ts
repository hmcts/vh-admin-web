import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { BHClient } from '../services/clients/api-client';
import { UserIdentityService } from '../services/user-identity.service';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { WorkAllocationComponent } from './work-allocation.component';
import { FileType } from '../common/model/file-type';

describe('WorkAllocationComponent', () => {
    let component: WorkAllocationComponent;
    let fixture: ComponentFixture<WorkAllocationComponent>;

    let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    userIdentityServiceSpy = jasmine.createSpyObj('UserIdentityService', ['getUserInformation']);
    userIdentityServiceSpy.getUserInformation.and.returnValue(
        of({
            is_vh_team_leader: true
        })
    );

    beforeEach(() => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['uploadWorkHours', 'uploadNonWorkingHours']);
        bHClientSpy.uploadWorkHours.and.returnValue(of({ failed_usernames: [] }));
        bHClientSpy.uploadNonWorkingHours.and.returnValue(of({ failed_usernames: [] }));

        TestBed.configureTestingModule({
            imports: [FontAwesomeTestingModule],
            declarations: [WorkAllocationComponent],
            providers: [
                { provide: BHClient, useValue: bHClientSpy },
                { provide: UserIdentityService, useValue: userIdentityServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkAllocationComponent);
        component = fixture.componentInstance;
        component.dataChangedBroadcast = jasmine.createSpyObj('dataChangedBroadcast', ['emit']);
        fixture.detectChanges();
    });

    describe('rendering', () => {
        it('should show vh team leader view', () => {
            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('div')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual(`Upload working hours / non-availability
Manage team
Allocate hearings`);
        });

        it('should show vho view', () => {
            component.isVhTeamLeader = false;
            fixture.detectChanges();

            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('div')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual(''); // update if more divs become available
        });

        it('should show working hours file upload max size error', () => {
            component.workingHoursFileValidationErrors.push('error message');
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#working-hours-file-upload-error')).nativeElement.innerText;
            expect(error).toContain('Error: error message');
        });

        it('should show file upload formatting errors', () => {
            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,19:00,a7:00,0900,17:30,17:30,08:00,09:60,17:-01,09:00,,,,,'
            );
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#working-hours-file-upload-error')).nativeElement.innerText;
            expect(error).toContain(
                ' Error: Row 3, Entry 2 - Hour value (19) is not within 08:00 - 18:00' +
                    '  Error: Row 3, Entry 3 - Value is not a valid time' +
                    '  Error: Row 3, Entry 4 - Incorrect delimiter used. Please use a colon to separate the hours and minutes.' +
                    '  Error: Row 3, Entry 6-7 - End time 8:00 is before start time 17:30' +
                    '  Error: Row 3, Entry 8 - Minutes value (60) is not within 0-59' +
                    '  Error: Row 3, Entry 9 - Minutes value (-1) is not within 0-59' +
                    '  Error: Row 3, Entry 10-11 - End time is blank'
            );
        });

        it('should show non-working hours file upload max size error', () => {
            component.nonWorkingHoursFileValidationErrors.push('error message');
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#non-working-hours-file-upload-error')).nativeElement.innerText;
            expect(error).toContain('Error: error message');
        });

        it('should show non-working hours file upload formatting errors', () => {
            component.readNonWorkAvailability(
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                    'first.second@xyz.com,2022-01-01,10#00,2022-01-07,17:00\n' +
                    'first.second2@xyz.com,2022-01-01,10:100,2022-01-07,17:00'
            );
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#non-working-hours-file-upload-error')).nativeElement.innerText;
            expect(error).toContain(
                ' Error: Row 2, Entry 2 - Incorrect delimiter used. Please use a colon to separate the hours and minutes. ' +
                    ' Error: Row 3 - Contains an invalid date'
            );
        });

        describe('upload work hours result', () => {
            it('should show success result', done => {
                component.readWorkAvailability(
                    'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                        ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                        'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                        'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,'
                );
                fixture.detectChanges();

                bHClientSpy.uploadWorkHours().subscribe(() => {
                    const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                    expect(result).toBe(' Team working hours uploaded successfully ');
                    done();
                });
            });

            it('should show partial success result', done => {
                bHClientSpy.uploadWorkHours.and.returnValue(of({ failed_usernames: ['first.second@xyz.com'] }));

                component.readWorkAvailability(
                    'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                        ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                        'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                        'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,'
                );
                fixture.detectChanges();

                bHClientSpy.uploadWorkHours().subscribe(() => {
                    const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                    expect(result).toBe(
                        ' Team working hours upload partially successfully. Below CTSC support officer(s) could ' +
                            'not be found: first.second@xyz.com Please check that these user names have been entered correctly. ' +
                            'If the problem persists, please raise a ticket in ServiceNow. '
                    );
                    done();
                });
            });

            it('should show failure result', done => {
                bHClientSpy.uploadWorkHours.and.returnValue(of({ failed_usernames: ['first.second@xyz.com', 'first.second.2@xyz.com'] }));
                component.readWorkAvailability(
                    'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                        ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                        'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                        'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,'
                );
                fixture.detectChanges();

                bHClientSpy.uploadWorkHours().subscribe(() => {
                    const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                    expect(result).toBe(
                        ' Team working hours not uploaded. No users found. ' +
                            ' Please check that these user names have been entered correctly. ' +
                            'If the problem persists, please raise a ticket in ServiceNow. '
                    );
                    done();
                });
            });
        });

        describe('upload non-working hours result', () => {
            it('should show success result', done => {
                component.readNonWorkAvailability(
                    'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                        'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                        'first.second2@xyz.com,2022-01-01,10:00,2022-01-07,17:00'
                );
                fixture.detectChanges();

                bHClientSpy.uploadNonWorkingHours().subscribe(() => {
                    const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                    expect(result).toBe(' Team non-availability hours uploaded successfully ');
                    done();
                });
            });

            it('should show partial success result', done => {
                bHClientSpy.uploadNonWorkingHours.and.returnValue(of({ failed_usernames: ['first.second@xyz.com'] }));

                component.readNonWorkAvailability(
                    'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                        'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                        'first.second@xyz.com,2022-01-01,10:00,2022-01-07,17:00'
                );
                fixture.detectChanges();

                bHClientSpy.uploadNonWorkingHours().subscribe(() => {
                    const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                    expect(result).toBe(
                        ' Team non-availability hours upload partially successfully. Below CTSC support officer(s) could ' +
                            'not be found: first.second@xyz.com Please check that these user names have been entered correctly. ' +
                            'If the problem persists, please raise a ticket in ServiceNow. '
                    );
                    done();
                });
            });

            it('should show failure result', done => {
                bHClientSpy.uploadNonWorkingHours.and.returnValue(
                    of({ failed_usernames: ['manual.vhoteamlead1@hearings.reform.hmcts.net', 'first.second.2@xyz.com'] })
                );

                component.readNonWorkAvailability(
                    'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                        'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                        'first.second2@xyz.com,2022-01-01,10:00,2022-01-07,17:00'
                );
                fixture.detectChanges();

                bHClientSpy.uploadNonWorkingHours().subscribe(() => {
                    const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                    expect(result).toBe(
                        ' Team non-availability hours not uploaded. No users found. ' +
                            ' Please check that these user names have been entered correctly. ' +
                            'If the problem persists, please raise a ticket in ServiceNow. '
                    );
                    done();
                });
            });
        });
    });

    it('should retrieve vh team leader status', () => {
        expect(component.isVhTeamLeader).toBeTruthy();
    });

    describe('validateDayWorkingHours', () => {
        it('should validate start time', () => {
            const startTimeArray = [10, 0];
            const endTimeArray = [17, 0];
            const rowNumber = 2;
            const entryNumber = 3;

            const validateSpy = spyOn(component, 'validateTimeCell');

            component.validateDayWorkingHours(startTimeArray, endTimeArray, rowNumber, entryNumber);

            expect(validateSpy).toHaveBeenCalledWith(startTimeArray, `Row ${rowNumber}, Entry ${entryNumber} -`);
        });

        it('should validate end time', () => {
            const startTimeArray = [10, 0];
            const endTimeArray = [17, 0];
            const rowNumber = 2;
            const entryNumber = 3;

            const validateSpy = spyOn(component, 'validateTimeCell');

            component.validateDayWorkingHours(startTimeArray, endTimeArray, rowNumber, entryNumber);

            expect(validateSpy).toHaveBeenCalledWith(startTimeArray, `Row ${rowNumber}, Entry ${entryNumber} -`);
        });

        it('should validate start time is before end time', () => {
            const startTimeArray = [10, 0];
            const endTimeArray = [17, 0];
            const rowNumber = 2;
            const entryNumber = 3;

            const validateSpy = spyOn(component, 'validateStartTimeBeforeEndTime');

            component.validateDayWorkingHours(startTimeArray, endTimeArray, rowNumber, entryNumber);

            expect(validateSpy).toHaveBeenCalledWith(
                startTimeArray[0],
                startTimeArray[1],
                endTimeArray[0],
                endTimeArray[1],
                `Row ${rowNumber}, Entry ${entryNumber}-${entryNumber + 1} -`
            );
        });
    });

    describe('handleFileInput', () => {
        it('should reset file upload errors', () => {
            const resetErrorsSpy = spyOn(component, 'resetErrors');
            const file = new File([''], 'filename', { type: 'text/html' });

            component.handleFileInput(file, FileType.UploadNonWorkingHours);

            expect(resetErrorsSpy).toHaveBeenCalled();
        });

        it('should not assign working hours file if file is null', () => {
            const resetErrorsSpy = spyOn(component, 'resetErrors');
            const file = new File([''], 'filename', { type: 'text/html' });
            component.workingHoursFile = file;

            component.handleFileInput(null, FileType.UploadNonWorkingHours);

            expect(component.workingHoursFile).not.toBeNull();
        });

        it('should not assign non-working hours file if file is null', () => {
            const resetErrorsSpy = spyOn(component, 'resetErrors');
            const file = new File([''], 'filename', { type: 'text/html' });
            component.nonWorkingHoursFile = file;

            component.handleFileInput(null, FileType.UploadNonWorkingHours);

            expect(component.nonWorkingHoursFile).not.toBeNull();
        });

        it(`should set errors when maximum working hours file size is exceeded`, () => {
            const file = new File([''], 'filename', { type: 'text/html' });
            Object.defineProperty(file, 'size', { value: 2000001 });

            component.handleFileInput(file, FileType.UploadWorkingHours);

            expect(component.workingHoursFileValidationErrors[0]).toBe('File cannot be larger than 200kb');
        });

        it(`should set errors when maximum non-working hours file size is exceeded`, () => {
            const file = new File([''], 'filename', { type: 'text/html' });
            Object.defineProperty(file, 'size', { value: 2000001 });

            component.handleFileInput(file, FileType.UploadNonWorkingHours);

            expect(component.nonWorkingHoursFileValidationErrors[0]).toBe('File cannot be larger than 200kb');
        });
    });

    describe('isDelimiterValid', () => {
        it('should return false when incorrect delimeter is used in working hours file', () => {
            const rowNumber = 2;
            const entryNumber = 3;

            const result = component.isDelimiterValid('0900');

            expect(result).toBeFalsy();
        });

        it('should return true when correct delimeter is used', () => {
            const rowNumber = 2;
            const entryNumber = 3;

            const result = component.isDelimiterValid('09:00');

            expect(result).toBeTruthy();
        });
    });

    describe('isNonWorkingDay', () => {
        it('should return true when start time and end time are blank', () => {
            const endTimes = ['', '\r'];

            endTimes.forEach((endTime: string) => {
                const result = component.isNonWorkingDay('', endTime);
                expect(result).toBeTruthy();
            });
        });

        it('should return false when start time and end time are populated', () => {
            const result = component.isNonWorkingDay('09:00', '17:30');
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
                const isError = component.isNonWorkingDayError(testCase.startTime, testCase.endTime);

                expect(isError).toBeTruthy();
                expect(component.workingHoursFileValidationErrors[0]).toBe(testCase.errorMessage);
            });
        });

        it('should add space to passed in error message', () => {
            component.isNonWorkingDayError('', '17:30', 'Location -');
            expect(component.workingHoursFileValidationErrors[0]).toBe('Location - Start time is blank');
        });
    });

    describe('resetErrors', () => {
        it('should reset errors', () => {
            component.workingHoursFileValidationErrors.push('error message');
            component.nonWorkingHoursFileValidationErrors.push('error message');

            component.resetErrors();

            expect(component.workingHoursFileValidationErrors).toEqual([]);
            expect(component.nonWorkingHoursFileValidationErrors).toEqual([]);
        });
    });

    describe('readFile', () => {
        it('should read file and return reader', () => {
            const file = new File([''], 'filename', { type: 'text/html' });

            const reader = component.readFile(file);

            expect(reader).not.toBeNull();
        });
    });

    describe('readWorkAvailability', () => {
        it('should not call api to upload work hours when validation errors exist', () => {
            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,900,17:00,09:00,17:30,9:30,18:00,09:00,17:00,09:00,17:00,,,,'
            );

            expect(bHClientSpy.uploadWorkHours).not.toHaveBeenCalled();
        });

        it('should call api to upload work hours', () => {
            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,09:00,17:00,09:00,17:00,,,,'
            );

            expect(bHClientSpy.uploadWorkHours).toHaveBeenCalled();
        });
    });

    describe('readNonWorkAvailability', () => {
        it('should not call api to upload work hours when validation errors exist', () => {
            component.readNonWorkAvailability(
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                    'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                    'first.second2@xyz.com,2022-01-01,1000,2022-01-07,17:00'
            );

            expect(bHClientSpy.uploadNonWorkingHours).not.toHaveBeenCalled();
        });

        it('should call api to upload work hours', () => {
            component.readNonWorkAvailability(
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                    'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                    'first.second2@xyz.com,2022-01-01,10:00,2022-01-07,17:00'
            );

            expect(bHClientSpy.uploadNonWorkingHours).toHaveBeenCalled();
        });
    });

    describe('uploadWorkingHours', () => {
        it('should reset file upload errors', () => {
            const resetErrorsSpy = spyOn(component, 'resetErrors');

            component.uploadWorkingHours();

            expect(resetErrorsSpy).toHaveBeenCalled();
        });

        it('should not read file if file does not exist', () => {
            spyOn(component, 'resetErrors');
            const readFileSpy = spyOn(component, 'readFile');

            component.uploadWorkingHours();

            expect(readFileSpy).not.toHaveBeenCalled();
        });

        it('should read file', () => {
            spyOn(component, 'resetErrors');

            const readFileSpy = spyOn(component, 'readFile').and.returnValue({
                onload: () => 'fileContents'
            });

            component.workingHoursFile = new File([''], 'filename', { type: 'text/html' });

            component.uploadWorkingHours();

            expect(readFileSpy).toHaveBeenCalledWith(component.workingHoursFile);
        });
    });

    describe('uploadNonWorkingHours', () => {
        it('should reset file upload errors', () => {
            const resetErrorsSpy = spyOn(component, 'resetErrors');

            component.uploadNonWorkingHours();

            expect(resetErrorsSpy).toHaveBeenCalled();
        });

        it('should not read file if file does not exist', () => {
            spyOn(component, 'resetErrors');
            const readFileSpy = spyOn(component, 'readFile');

            component.uploadNonWorkingHours();

            expect(readFileSpy).not.toHaveBeenCalled();
        });

        it('should read file', () => {
            spyOn(component, 'resetErrors');

            const readFileSpy = spyOn(component, 'readFile').and.returnValue({
                onload: () => 'fileContents'
            });

            component.nonWorkingHoursFile = new File([''], 'filename', { type: 'text/html' });

            component.uploadNonWorkingHours();

            expect(readFileSpy).toHaveBeenCalledWith(component.nonWorkingHoursFile);
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
                const isValid = component.validateTimeCell(testCase.timeCell, '');

                expect(isValid).toBeFalsy();
                expect(component.workingHoursFileValidationErrors[0]).toBe(testCase.errorMessage);
            });
        });

        it('should add space to passed in error message', () => {
            component.validateTimeCell([NaN, 30], 'Location -');
            expect(component.workingHoursFileValidationErrors[0]).toBe('Location - Value is not a valid time');
        });

        it('should return true with no error message', () => {
            const isValid = component.validateTimeCell([9, 30], 'Location -');

            expect(isValid).toBeTruthy();
            expect(component.workingHoursFileValidationErrors[0]).toBeUndefined();
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

                const isValid = component.validateStartTimeBeforeEndTime(
                    testCase.startTimeHour,
                    testCase.startTimeMinute,
                    testCase.endTimeHour,
                    testCase.endTimeMinute,
                    ''
                );

                expect(isValid).toBeFalsy();
                expect(component.workingHoursFileValidationErrors[0]).toBe(`End time ${endTime} is before start time ${startTime}`);
            });
        });

        it('should add space to passed in error message', () => {
            const startTime = '11:00';
            const endTime = '9:00';

            component.validateStartTimeBeforeEndTime(11, 0, 9, 0, 'Location -');
            expect(component.workingHoursFileValidationErrors[0]).toBe(`Location - End time ${endTime} is before start time ${startTime}`);
        });

        it('should return true with no error message', () => {
            const isValid = component.validateStartTimeBeforeEndTime(9, 0, 17, 0, 'Location -');

            expect(isValid).toBeTruthy();
            expect(component.workingHoursFileValidationErrors[0]).toBeUndefined();
        });

        it('should call handleContinue and click on non working Option', async () => {
            await component.handleContinue();

            expect(component).toBeTruthy();
            expect(component.dataChangedBroadcast.emit).toHaveBeenCalledWith(false);
        });

        it('should call cancelEditing and emit dataChange', async () => {
            await component.cancelEditing();

            expect(component).toBeTruthy();
            expect(component.dataChangedBroadcast.emit).toHaveBeenCalledWith(true);
        });

        it('should call onDataChange and emit dataChange', async () => {
            await component.onDataChange(true);

            expect(component).toBeTruthy();
            expect(component.showSaveConfirmation).toBeTruthy();
        });
    });
});
