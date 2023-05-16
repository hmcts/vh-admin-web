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
        workHoursProcessorSpy.isFileFormatValild.and.returnValue(true);
        TestBed.configureTestingModule({
            imports: [FontAwesomeTestingModule],
            declarations: [UploadWorkHoursComponent],
            providers: [{ provide: WorkHoursFileProcessorService, useValue: workHoursProcessorSpy }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UploadWorkHoursComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
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
