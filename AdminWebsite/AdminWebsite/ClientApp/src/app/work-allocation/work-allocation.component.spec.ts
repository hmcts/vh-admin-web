import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { UserIdentityService } from '../services/user-identity.service';

import { WorkAllocationComponent } from './work-allocation.component';

fdescribe('WorkAllocationComponent', () => {
    let component: WorkAllocationComponent;
    let fixture: ComponentFixture<WorkAllocationComponent>;

    let userIdentityServiceSpy: jasmine.SpyObj<UserIdentityService>;
    userIdentityServiceSpy = jasmine.createSpyObj('UserIdentityService', ['getUserInformation']);
    userIdentityServiceSpy.getUserInformation.and.returnValue(
        of({
            is_vh_team_leader: true
        })
    );

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WorkAllocationComponent],
            providers: [{ provide: UserIdentityService, useValue: userIdentityServiceSpy }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkAllocationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('rendering', () => {
        it('should show vh team leader view', () => {
            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('div')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual(`Upload working hours / non-availability
Edit working hours / non-availability
Manage team
Allocate hearings`);
        });

        it('should show vho view', () => {
            component.isVhTeamLeader = false;
            fixture.detectChanges();

            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('div')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual('Edit working hours / non-availability');
        });

        it('should show working hours file upload max size error', () => {
            component.isWorkingHoursFileUploadError = true;
            component.workingHoursFileUploadErrors.push('error message');
            fixture.detectChanges();

            const error = fixture.debugElement.query(By.css('#working-hours-file-upload-error'))
                .nativeElement.innerText;
            expect(error).toContain('Error: error message');
        });
    });

    it('should retrieve vh team leader status', () => {
        expect(component.isVhTeamLeader).toBeTruthy();
    });

    describe('handleFileInput', () => {
        it('should reset file upload errors', () => {
            const resetErrorsSpy = spyOn(component, 'resetErrors');
            const file = new File([""], "filename", { type: 'text/html' });

            component.handleFileInput(file);

            expect(resetErrorsSpy).toHaveBeenCalled();
        });
        
        it('should set errors when maximum file size is exceeded', () => {
            const file = new File([""], "filename", { type: 'text/html' });
            Object.defineProperty(file, 'size', { value: 2000001 });

            component.handleFileInput(file);

            expect(component.isWorkingHoursFileUploadError).toBe(true);
            expect(component.workingHoursFileUploadErrors[0]).toBe('File cannot be larger than 200kb');
        });
    });

    describe('resetErrors', () => {
        it('should reset errors', () => {
            component.isWorkingHoursFileUploadError = true;
            component.workingHoursFileUploadErrors.push('error message');
        
            component.resetErrors();

            expect(component.isWorkingHoursFileUploadError).toBe(false);
            expect(component.workingHoursFileUploadErrors).toEqual([]);
        });
    });

    describe('uploadWorkingHours', () => {
        it('should reset file upload errors', () => {
            const resetErrorsSpy = spyOn(component, 'resetErrors');

            component.uploadWorkingHours();

            expect(resetErrorsSpy).toHaveBeenCalled();
        });
        
        it('should does not read file if file does not exist', () => {
            spyOn(component, 'resetErrors');
            const readFileSpy = spyOn(component, 'readFile');

            component.uploadWorkingHours();

            expect(readFileSpy).not.toHaveBeenCalled();
        });
        
        it('should read file', () => {
            spyOn(component, 'resetErrors');
            const readFileSpy = spyOn(component, 'readFile');

            component.workingHoursFile = new File([""], "filename", { type: 'text/html' });

            component.uploadWorkingHours();

            expect(readFileSpy).toHaveBeenCalledWith(component.workingHoursFile);
        });
    });

    describe('validateTimeCell', () => {
        const testCases = [
            { case: 'hour is not a number', timeCell: [NaN, 30], errorMessage: 'Value is not a valid time' },
            { case: 'minute is not a number', timeCell: [9, NaN], errorMessage: 'Value is not a valid time' },
            { case: 'hour is before work hours', timeCell: [8, 30], errorMessage: 'Hour value (8) is not within 08:00 - 18:00' },
            { case: 'hour is after work hours', timeCell: [19, 30], errorMessage: 'Hour value (19) is not within 08:00 - 18:00' },
            { case: 'minute is above 59', timeCell: [9, -1], errorMessage: 'Minutes value (-1) is not within 0-59' },
            { case: 'minute is below 0', timeCell: [9, 60], errorMessage: 'Minutes value (60) is not within 0-59' },
        ];
        
        testCases.forEach(testCase => {
            it(`should return false and add error message when ${testCase.case}`, () => {
                const isValid = component.validateTimeCell(testCase.timeCell, '');

                expect(isValid).toBeFalsy();
                expect(component.workingHoursFileUploadErrors[0])
                    .toBe(testCase.errorMessage);
            })
        });
        
        it('should add space to passed in error message', () => {
            component.validateTimeCell([NaN, 30], 'Location -');
            expect(component.workingHoursFileUploadErrors[0]).toBe('Location - Value is not a valid time');
        });

        it('should return true with no error message', () => {
            const isValid = component.validateTimeCell([9, 30], 'Location -');

            expect(isValid).toBeTruthy();
            expect(component.workingHoursFileUploadErrors[0]).toBeUndefined();
        });
    });
    
    describe('validateTimeCell', () => {
        const testCases = [
            { startTimeHour: 11, startTimeMinute: 0, endTimeHour: 9, endTimeMinute: 0},
            { startTimeHour: 11, startTimeMinute: 0, endTimeHour: 9, endTimeMinute: 30},
            { startTimeHour: 12, startTimeMinute: 30, endTimeHour: 12, endTimeMinute: 20},
        ];
        
        testCases.forEach(testCase => {
            it(`should return false and add error message when end time is before start time`, () => {
                const startTime = `${testCase.startTimeHour}:${testCase.startTimeMinute == 0 ? '00' : testCase.startTimeMinute}`;
                const endTime = `${testCase.endTimeHour}:${testCase.endTimeMinute == 0 ? '00' : testCase.endTimeMinute}`;
                
                const isValid = component.validateStartTimeBeforeEndTime(
                    testCase.startTimeHour, testCase.startTimeMinute, testCase.endTimeHour, testCase.endTimeMinute, '');

                expect(isValid).toBeFalsy();
                expect(component.workingHoursFileUploadErrors[0])
                    .toBe(`End time ${endTime} is before start time ${startTime}`);
            })
        });
        
        it('should add space to passed in error message', () => {
            const startTime = '11:00'
            const endTime = '9:00'
            
            component.validateStartTimeBeforeEndTime(11, 0, 9, 0, 'Location -');
            expect(component.workingHoursFileUploadErrors[0]).toBe(`Location - End time ${endTime} is before start time ${startTime}`);
        });

        it('should return true with no error message', () => {
            const isValid = component.validateStartTimeBeforeEndTime(9, 0, 17, 0, 'Location -');

            expect(isValid).toBeTruthy();
            expect(component.workingHoursFileUploadErrors[0]).toBeUndefined();
        });
    });
});
