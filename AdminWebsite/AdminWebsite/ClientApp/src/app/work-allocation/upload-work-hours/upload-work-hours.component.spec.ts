import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { of } from 'rxjs';
import { FileType } from 'src/app/common/model/file-type';
import { UploadNonWorkingHoursRequest, UploadWorkHoursRequest, UploadWorkHoursResponse } from 'src/app/services/clients/api-client';
import {
    NonWorkHoursFileProcessResult,
    WorkHoursFileProcessorService,
    WorkHoursFileProcessResult
} from '../services/work-hours-file-processor.service';

import { UploadWorkHoursComponent } from './upload-work-hours.component';

describe('UploadWorkHoursComponent', () => {
    let component: UploadWorkHoursComponent;
    let fixture: ComponentFixture<UploadWorkHoursComponent>;

    let workHoursProcessorSpy: jasmine.SpyObj<WorkHoursFileProcessorService>;

    beforeEach(async () => {
        workHoursProcessorSpy = jasmine.createSpyObj<WorkHoursFileProcessorService>([
            'processWorkHours',
            'processNonWorkHours',
            'uploadWorkingHours',
            'uploadNonWorkingHours',
            'isFileTooBig',
            'isFileFormatValild'
        ]);

        // when jasmine is upgraded then properties can be included in the above statement
        workHoursProcessorSpy = {
            ...workHoursProcessorSpy,
            maxFileUploadSize: 200000
        } as jasmine.SpyObj<WorkHoursFileProcessorService>;

        workHoursProcessorSpy.isFileTooBig.and.returnValue(false);
        TestBed.configureTestingModule({
            imports: [FontAwesomeTestingModule],
            declarations: [UploadWorkHoursComponent],
            providers: [{ provide: WorkHoursFileProcessorService, useValue: workHoursProcessorSpy }]
        }).compileComponents();

        workHoursProcessorSpy.isFileFormatValild.and.returnValue(true);
        TestBed.configureTestingModule({
            declarations: [UploadWorkHoursComponent],
            providers: [{ provide: WorkHoursFileProcessorService, useValue: workHoursProcessorSpy }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UploadWorkHoursComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('rendering', () => {
        it('should show working hours file upload max size error', () => {
            component.workingHoursFileValidationErrors.push('error message');
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#working-hours-file-upload-error')).nativeElement.innerText;
            expect(error).toContain('Error: error message');
        });

        it('should show file upload formatting errors', () => {
            const processorResult: WorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 1,
                uploadWorkHoursRequest: [],
                fileValidationErrors: [
                    'Row 3, Entry 2 - Hour value (19) is not within 08:00 - 18:00',
                    'Row 3, Entry 3 - Value is not a valid time',
                    'Row 3, Entry 4 - Incorrect delimiter used. Please use a colon to separate the hours and minutes.',
                    'Row 3, Entry 6-7 - End time 8:00 is before start time 17:30',
                    'Row 3, Entry 8 - Minutes value (60) is not within 0-59',
                    'Row 3, Entry 9 - Minutes value (-1) is not within 0-59',
                    'Row 3, Entry 10-11 - End time is blank'
                ]
            };
            workHoursProcessorSpy.processWorkHours.and.returnValue(processorResult);
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

        it('should show file upload duplicate user errors', () => {
            const processorResult: WorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 2,
                uploadWorkHoursRequest: [],
                fileValidationErrors: ['first.second@xyz.com - Multiple entries for user. Only one row per user required']
            };
            workHoursProcessorSpy.processWorkHours.and.returnValue(processorResult);

            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                    'first.second@xyz.com,10:00,17:00,11:00,17:30,12:30,18:00,13:00,18:00,14:00,17:00,,,,\n' +
                    'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,'
            );
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#working-hours-file-upload-error')).nativeElement.innerText;
            expect(error).toContain('Error: first.second@xyz.com - Multiple entries for user. Only one row per user required');
        });

        it('should show non-working hours file upload max size error', () => {
            component.nonWorkingHoursFileValidationErrors.push('error message');
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#non-working-hours-file-upload-error')).nativeElement.innerText;
            expect(error).toContain('Error: error message');
        });

        it('should show non-working hours file upload formatting errors', () => {
            const processorResult: NonWorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 2,
                uploadNonWorkHoursRequest: [],
                fileValidationErrors: [
                    'Row 2, Entry 2 - Incorrect delimiter used. Please use a colon to separate the hours and minutes.',
                    'Row 3 - Contains an invalid date'
                ]
            };
            workHoursProcessorSpy.processNonWorkHours.and.returnValue(processorResult);

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
    });

    describe('upload work hours result', () => {
        it('should show success result', done => {
            const processorResult: WorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 2,
                uploadWorkHoursRequest: [
                    new UploadWorkHoursRequest({ username: 'first.second@xyz.com', working_hours: [] }),
                    new UploadWorkHoursRequest({ username: 'first.second.2@xyz.com', working_hours: [] })
                ],
                fileValidationErrors: []
            };
            workHoursProcessorSpy.processWorkHours.and.returnValue(processorResult);
            workHoursProcessorSpy.uploadWorkingHours.and.returnValue(
                of(
                    new UploadWorkHoursResponse({
                        failed_usernames: []
                    })
                )
            );

            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                    'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,'
            );
            fixture.detectChanges();

            workHoursProcessorSpy.uploadWorkingHours().subscribe(() => {
                const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                expect(result).toBe(' Team working hours uploaded successfully ');
                done();
            });
        });

        it('should show partial success result', done => {
            const processorResult: WorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 2,
                uploadWorkHoursRequest: [
                    new UploadWorkHoursRequest({ username: 'first.second@xyz.com', working_hours: [] }),
                    new UploadWorkHoursRequest({ username: 'first.second.2@xyz.com', working_hours: [] })
                ],
                fileValidationErrors: []
            };
            workHoursProcessorSpy.processWorkHours.and.returnValue(processorResult);
            workHoursProcessorSpy.uploadWorkingHours.and.returnValue(
                of(new UploadWorkHoursResponse({ failed_usernames: ['first.second@xyz.com'] }))
            );

            workHoursProcessorSpy.uploadWorkingHours.and.returnValue(of({ failed_usernames: ['first.second@xyz.com'] }));

            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                    'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,'
            );
            fixture.detectChanges();

            workHoursProcessorSpy.uploadWorkingHours().subscribe(() => {
                const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                expect(result).toBe(
                    ' Team working hours upload partially successful. Below user(s) could ' +
                        'not be found: first.second@xyz.com Please check that these user names have been entered correctly. ' +
                        'If the problem persists, please raise a ticket in ServiceNow. '
                );
                done();
            });
        });

        it('should show failure result', done => {
            const processorResult: WorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 2,
                uploadWorkHoursRequest: [
                    new UploadWorkHoursRequest({ username: 'first.second@xyz.com', working_hours: [] }),
                    new UploadWorkHoursRequest({ username: 'first.second.2@xyz.com', working_hours: [] })
                ],
                fileValidationErrors: []
            };
            workHoursProcessorSpy.processWorkHours.and.returnValue(processorResult);
            workHoursProcessorSpy.uploadWorkingHours.and.returnValue(
                of({ failed_usernames: ['first.second@xyz.com', 'first.second.2@xyz.com'] })
            );

            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,\n' +
                    'first.second.2@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,08:00,18:00,9:00,17:00,,,,'
            );
            fixture.detectChanges();

            workHoursProcessorSpy.uploadWorkingHours().subscribe(() => {
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
            const processorResult: WorkHoursFileProcessResult = {
                fileValidationErrors: [],
                numberOfUserNameToUpload: 2,
                uploadWorkHoursRequest: [
                    new UploadNonWorkingHoursRequest({ username: 'manual.vhoteamlead1@hearings.reform.hmcts.net' }),
                    new UploadNonWorkingHoursRequest({ username: 'first.second2@xyz.com' })
                ]
            };

            workHoursProcessorSpy.processNonWorkHours.and.returnValue(processorResult);
            workHoursProcessorSpy.uploadNonWorkingHours.and.returnValue(of({ failed_usernames: [] }));

            component.readNonWorkAvailability(
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                    'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                    'first.second2@xyz.com,2022-01-01,10:00,2022-01-07,17:00'
            );
            fixture.detectChanges();
            workHoursProcessorSpy.uploadNonWorkingHours().subscribe(() => {
                const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                expect(result).toBe(' Team non-availability hours uploaded successfully ');
                done();
            });
        });

        it('should show partial success result', done => {
            const processorResult: WorkHoursFileProcessResult = {
                fileValidationErrors: [],
                numberOfUserNameToUpload: 2,
                uploadWorkHoursRequest: [
                    new UploadNonWorkingHoursRequest({ username: 'manual.vhoteamlead1@hearings.reform.hmcts.net' }),
                    new UploadNonWorkingHoursRequest({ username: 'first.second2@xyz.com' })
                ]
            };

            workHoursProcessorSpy.processNonWorkHours.and.returnValue(processorResult);
            workHoursProcessorSpy.uploadNonWorkingHours.and.returnValue(of({ failed_usernames: ['first.second@xyz.com'] }));

            component.readNonWorkAvailability(
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                    'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                    'first.second@xyz.com,2022-01-01,10:00,2022-01-07,17:00'
            );
            fixture.detectChanges();

            workHoursProcessorSpy.uploadNonWorkingHours().subscribe(() => {
                const result = fixture.debugElement.query(By.css('#file-upload-result')).nativeElement.innerText;
                expect(result).toBe(
                    ' Team non-availability hours upload partially successful. Below user(s) could ' +
                        'not be found: first.second@xyz.com Please check that these user names have been entered correctly. ' +
                        'If the problem persists, please raise a ticket in ServiceNow. '
                );
                done();
            });
        });

        it('should show failure result', done => {
            const processorResult: WorkHoursFileProcessResult = {
                fileValidationErrors: [],
                numberOfUserNameToUpload: 2,
                uploadWorkHoursRequest: [
                    new UploadNonWorkingHoursRequest({ username: 'manual.vhoteamlead1@hearings.reform.hmcts.net' }),
                    new UploadNonWorkingHoursRequest({ username: 'first.second2@xyz.com' })
                ]
            };

            workHoursProcessorSpy.processNonWorkHours.and.returnValue(processorResult);
            workHoursProcessorSpy.uploadNonWorkingHours.and.returnValue(
                of({ failed_usernames: ['manual.vhoteamlead1@hearings.reform.hmcts.net', 'first.second2@xyz.com'] })
            );

            component.readNonWorkAvailability(
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                    'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                    'first.second2@xyz.com,2022-01-01,10:00,2022-01-07,17:00'
            );
            fixture.detectChanges();

            workHoursProcessorSpy.uploadNonWorkingHours().subscribe(() => {
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

    describe('handleFileInput', () => {
        it('should reset file upload errors', () => {
            const resetErrorsSpy = spyOn(component, 'resetNonWorkingHoursMessages');
            const file = new File([''], 'filename.csv', { type: 'text/csv' });

            component.handleFileInput(file, FileType.UploadNonWorkingHours);

            expect(resetErrorsSpy).toHaveBeenCalled();
        });

        it('should not assign working hours file if file is null', () => {
            const resetErrorsSpy = spyOn(component, 'resetWorkingHoursMessages');
            const file = new File([''], 'filename.csv', { type: 'text/csv' });
            component.workingHoursFile = file;

            component.handleFileInput(null, FileType.UploadWorkingHours);

            expect(component.workingHoursFile).not.toBeNull();
            expect(resetErrorsSpy).toHaveBeenCalled();
        });

        it('should not assign non-working hours file if file is null', () => {
            const resetErrorsSpy = spyOn(component, 'resetNonWorkingHoursMessages');
            const file = new File([''], 'filename.csv', { type: 'text/csv' });
            component.nonWorkingHoursFile = file;

            component.handleFileInput(null, FileType.UploadNonWorkingHours);

            expect(component.nonWorkingHoursFile).not.toBeNull();
            expect(resetErrorsSpy).toHaveBeenCalled();
        });

        it(`should set errors when maximum working hours file size is exceeded`, () => {
            const file = new File([''], 'filename.csv', { type: 'text/csv' });
            Object.defineProperty(file, 'size', { value: 2000001 });
            workHoursProcessorSpy.isFileTooBig.and.returnValue(true);

            component.handleFileInput(file, FileType.UploadWorkingHours);

            expect(component.workingHoursFileValidationErrors[0]).toBe('File cannot be larger than 200kb');
        });

        it(`should set errors when maximum non-working hours file size is exceeded`, () => {
            const file = new File([''], 'filename.csv', { type: 'text/csv' });
            Object.defineProperty(file, 'size', { value: 2000001 });
            workHoursProcessorSpy.isFileTooBig.and.returnValue(true);

            component.handleFileInput(file, FileType.UploadNonWorkingHours);

            expect(component.nonWorkingHoursFileValidationErrors[0]).toBe('File cannot be larger than 200kb');
        });
    });

    describe('resetErrors', () => {
        it('should reset working hour errors', () => {
            component.workingHoursFileValidationErrors.push('error message');

            component.resetWorkingHoursMessages();

            expect(component.workingHoursFileValidationErrors).toEqual([]);
        });

        it('should reset non-working hour errors', () => {
            component.nonWorkingHoursFileValidationErrors.push('error message');

            component.resetNonWorkingHoursMessages();

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
            const processorResult: WorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 1,
                uploadWorkHoursRequest: [],
                fileValidationErrors: [
                    'Row 3, Entry 2 - Hour value (19) is not within 08:00 - 18:00',
                    'Row 3, Entry 3 - Value is not a valid time',
                    'Row 3, Entry 4 - Incorrect delimiter used. Please use a colon to separate the hours and minutes.',
                    'Row 3, Entry 6-7 - End time 8:00 is before start time 17:30',
                    'Row 3, Entry 8 - Minutes value (60) is not within 0-59',
                    'Row 3, Entry 9 - Minutes value (-1) is not within 0-59',
                    'Row 3, Entry 10-11 - End time is blank'
                ]
            };
            workHoursProcessorSpy.processWorkHours.and.returnValue(processorResult);

            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,900,17:00,09:00,17:30,9:30,18:00,09:00,17:00,09:00,17:00,,,,'
            );

            expect(workHoursProcessorSpy.uploadWorkingHours).not.toHaveBeenCalled();
        });

        it('should call api to upload work hours', () => {
            const processorResult: WorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 1,
                uploadWorkHoursRequest: [new UploadWorkHoursRequest({ username: 'first.second@xyz.com', working_hours: [] })],
                fileValidationErrors: []
            };
            workHoursProcessorSpy.processWorkHours.and.returnValue(processorResult);
            workHoursProcessorSpy.uploadWorkingHours.and.returnValue(of({ failed_usernames: [] }));

            component.readWorkAvailability(
                'Username,Monday,,Tuesday,,Wednesday,,Thursday,,Friday,Saturday,Sunday\n' +
                    ',Start,End,Start,End,Start,End,Start,End,Start,End,Start,End,Start,End\n' +
                    'first.second@xyz.com,9:00,17:00,09:00,17:30,9:30,18:00,09:00,17:00,09:00,17:00,,,,'
            );

            expect(workHoursProcessorSpy.uploadWorkingHours).toHaveBeenCalled();
        });
    });

    describe('readNonWorkAvailability', () => {
        it('should not call api to upload work hours when validation errors exist', () => {
            const processorResult: NonWorkHoursFileProcessResult = {
                numberOfUserNameToUpload: 2,
                uploadNonWorkHoursRequest: [],
                fileValidationErrors: [
                    'Row 2, Entry 2 - Incorrect delimiter used. Please use a colon to separate the hours and minutes.',
                    'Row 3 - Contains an invalid date'
                ]
            };
            workHoursProcessorSpy.processNonWorkHours.and.returnValue(processorResult);

            component.readNonWorkAvailability(
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                    'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                    'first.second2@xyz.com,2022-01-01,1000,2022-01-07,17:00'
            );

            expect(workHoursProcessorSpy.uploadNonWorkingHours).not.toHaveBeenCalled();
        });

        it('should call api to upload work hours', () => {
            const processorResult: WorkHoursFileProcessResult = {
                fileValidationErrors: [],
                numberOfUserNameToUpload: 2,
                uploadWorkHoursRequest: [
                    new UploadNonWorkingHoursRequest({ username: 'manual.vhoteamlead1@hearings.reform.hmcts.net' }),
                    new UploadNonWorkingHoursRequest({ username: 'first.second2@xyz.com' })
                ]
            };

            workHoursProcessorSpy.processNonWorkHours.and.returnValue(processorResult);
            workHoursProcessorSpy.uploadNonWorkingHours.and.returnValue(of({ failed_usernames: [] }));

            component.readNonWorkAvailability(
                'Username,Start Date (YYYY-MM-DD),Start Time,End Date (YYYY-MM-DD),End Time\n' +
                    'manual.vhoteamlead1@hearings.reform.hmcts.net,2022-01-01,10:00,2022-01-08,17:00\n' +
                    'first.second2@xyz.com,2022-01-01,10:00,2022-01-07,17:00'
            );

            expect(workHoursProcessorSpy.uploadNonWorkingHours).toHaveBeenCalled();
        });
    });

    describe('uploadWorkingHours', () => {
        it('should reset file upload errors', () => {
            const resetErrorsSpy = spyOn(component, 'resetWorkingHoursMessages');

            component.uploadWorkingHours();

            expect(resetErrorsSpy).toHaveBeenCalled();
        });

        it('should not read file if file does not exist', () => {
            spyOn(component, 'resetWorkingHoursMessages');
            const readFileSpy = spyOn(component, 'readFile');

            component.uploadWorkingHours();

            expect(readFileSpy).not.toHaveBeenCalled();
        });

        it('should read file', () => {
            spyOn(component, 'resetWorkingHoursMessages');

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
            const resetErrorsSpy = spyOn(component, 'resetNonWorkingHoursMessages');

            component.uploadNonWorkingHours();

            expect(resetErrorsSpy).toHaveBeenCalled();
        });

        it('should not read file if file does not exist', () => {
            spyOn(component, 'resetNonWorkingHoursMessages');
            const readFileSpy = spyOn(component, 'readFile');

            component.uploadNonWorkingHours();

            expect(readFileSpy).not.toHaveBeenCalled();
        });

        it('should read file', () => {
            spyOn(component, 'resetNonWorkingHoursMessages');

            const readFileSpy = spyOn(component, 'readFile').and.returnValue({
                onload: () => 'fileContents'
            });

            component.nonWorkingHoursFile = new File([''], 'filename', { type: 'text/html' });

            component.uploadNonWorkingHours();

            expect(readFileSpy).toHaveBeenCalledWith(component.nonWorkingHoursFile);
        });
    });
});
