import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EditWorkHoursComponent } from './edit-work-hours.component';
import { BHClient, UploadWorkHoursRequest, VhoWorkHoursResponse, WorkingHours } from '../../services/clients/api-client';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { Logger } from 'src/app/services/logger';

describe('EditWorkHoursComponent', () => {
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    let component: EditWorkHoursComponent;
    let fixture: ComponentFixture<EditWorkHoursComponent>;

    beforeEach(async () => {
        bHClientSpy = jasmine.createSpyObj('BHClient', ['uploadWorkHours', 'uploadNonWorkingHours']);
        bHClientSpy.uploadWorkHours.and.returnValue(of({ failed_usernames: [] }));
        bHClientSpy.uploadNonWorkingHours.and.returnValue(of({ failed_usernames: [] }));
        loggerSpy = jasmine.createSpyObj('Logger', ['debug', 'error']);
        await TestBed.configureTestingModule({
            declarations: [EditWorkHoursComponent],
            providers: [
                { provide: BHClient, useValue: bHClientSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditWorkHoursComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    describe('rendering', () => {
        it('should show vh team leader view', () => {
            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('details')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual(`Edit working hours / non-availability`);
        });
        it('should show vho view', () => {
            component.isVhTeamLeader = false;
            fixture.detectChanges();

            const componentDebugElement: DebugElement = fixture.debugElement;
            const componentOuterDiv = componentDebugElement.query(By.css('details')).nativeElement;

            expect(componentOuterDiv.innerText).toEqual('Edit working hours / non-availability');
        });

        it('should show upload successful message', () => {
            component.isVhTeamLeader = true;
            component.isUploadWorkHoursSuccessful = true;
            fixture.detectChanges();

            const successElement = fixture.debugElement.query(By.css('#edit-upload-hours-success')).nativeElement;

            expect(successElement.innerText).toEqual('User working hours changes saved successfully ');
        });

        it('should show upload failure message', () => {
            component.isVhTeamLeader = true;
            component.isUploadWorkHoursFailure = true;
            fixture.detectChanges();

            const successElement = fixture.debugElement.query(By.css('#edit-upload-hours-failure')).nativeElement;

            expect(successElement.innerText).toEqual('Error: Work hour changes could not be saved.');
        });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('setSearchResult should assign event to results property', () => {
        const parameter: Array<VhoWorkHoursResponse> = [];
        component.setSearchResult(parameter);
        expect(component).toBeTruthy();
        expect(component.result).toBe(parameter);
    });

    it('setUsername should assign event to username property', () => {
        const username = 'username@test.com';
        component.setUsername(username);
        expect(component).toBeTruthy();
        expect(component.username).toBe(username);
    });

    describe('onSaveWorkHours', () => {
        it('should call api to upload work hours', () => {
            const vhoWorkHoursResponseOne = new VhoWorkHoursResponse();
            vhoWorkHoursResponseOne.day_of_week_id = 1;
            vhoWorkHoursResponseOne.end_time = '17:00';
            vhoWorkHoursResponseOne.start_time = '09:00';

            const vhoWorkHoursResponseTwo = new VhoWorkHoursResponse();
            vhoWorkHoursResponseTwo.day_of_week_id = 2;
            vhoWorkHoursResponseTwo.end_time = '17:30';
            vhoWorkHoursResponseTwo.start_time = null;

            const vhoWorkHoursResponseThree = new VhoWorkHoursResponse();
            vhoWorkHoursResponseThree.day_of_week_id = 3;
            vhoWorkHoursResponseThree.end_time = null;
            vhoWorkHoursResponseThree.start_time = '09:00';

            const vhoWorkHoursResponses = [vhoWorkHoursResponseOne, vhoWorkHoursResponseTwo, vhoWorkHoursResponseThree];

            const username = 'username@test.com';

            const expectedWorkingHoursOne = new WorkingHours();
            expectedWorkingHoursOne.day_of_week_id = vhoWorkHoursResponseOne.day_of_week_id;
            expectedWorkingHoursOne.end_time_hour = 17;
            expectedWorkingHoursOne.end_time_minutes = 0;
            expectedWorkingHoursOne.start_time_hour = 9;
            expectedWorkingHoursOne.start_time_minutes = 0;

            const expectedWorkingHoursTwo = new WorkingHours();
            expectedWorkingHoursTwo.day_of_week_id = vhoWorkHoursResponseTwo.day_of_week_id;
            expectedWorkingHoursTwo.end_time_hour = expectedWorkingHoursTwo.end_time_minutes = null;
            expectedWorkingHoursTwo.start_time_hour = expectedWorkingHoursTwo.start_time_minutes = null;

            const expectedWorkingHoursThree = new WorkingHours();
            expectedWorkingHoursThree.day_of_week_id = vhoWorkHoursResponseThree.day_of_week_id;
            expectedWorkingHoursThree.end_time_hour = expectedWorkingHoursThree.end_time_minutes = null;
            expectedWorkingHoursThree.start_time_hour = expectedWorkingHoursThree.start_time_minutes = null;

            const expectedUploadWorkHoursRequests = new UploadWorkHoursRequest();
            expectedUploadWorkHoursRequests.working_hours = [expectedWorkingHoursOne, expectedWorkingHoursTwo, expectedWorkingHoursThree];
            expectedUploadWorkHoursRequests.username = username;

            component.username = username;

            component.onSaveWorkHours(vhoWorkHoursResponses);

            expect(bHClientSpy.uploadWorkHours).toHaveBeenCalled();
            expect(bHClientSpy.uploadWorkHours).toHaveBeenCalledWith([expectedUploadWorkHoursRequests]);
            expect(component.isUploadWorkHoursSuccessful).toBeTruthy();
        });

        it('should show save failed popup when api fails', () => {
            bHClientSpy.uploadWorkHours.and.returnValue(throwError(new Error()));

            component.onSaveWorkHours([]);

            expect(component.isUploadWorkHoursFailure).toBeTruthy();
            expect(loggerSpy.error).toHaveBeenCalled();
        });
    });
});
