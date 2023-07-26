import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditWorkHoursComponent } from './edit-work-hours.component';
import {
    BHClient,
    NonWorkingHours,
    UpdateNonWorkingHoursRequest,
    UploadNonWorkingHoursResponse,
    UploadWorkHoursRequest,
    UploadWorkHoursResponse,
    VhoNonAvailabilityWorkHoursResponse,
    VhoWorkHoursResponse,
    WorkingHours
} from '../../services/clients/api-client';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { Logger } from 'src/app/services/logger';
import { VhoWorkHoursTableComponent } from './vho-work-hours-table/vho-work-hours-table.component';
import { EditVhoNonAvailabilityWorkHoursModel } from './edit-non-work-hours-model';
import { HoursType } from 'src/app/common/model/hours-type';
import { VideoHearingsService } from '../../services/video-hearings.service';

describe('EditWorkHoursComponent', () => {
    let bHClientSpy: jasmine.SpyObj<BHClient>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    let component: EditWorkHoursComponent;
    let fixture: ComponentFixture<EditWorkHoursComponent>;
    let videoServiceSpy: jasmine.SpyObj<VideoHearingsService>;

    beforeEach(async () => {
        videoServiceSpy = jasmine.createSpyObj('VideoHearingsService', [
            'cancelVhoNonAvailabiltiesRequest',
            'setVhoNonAvailabiltiesHaveChanged'
        ]);
        bHClientSpy = jasmine.createSpyObj('BHClient', ['uploadWorkHours', 'uploadNonWorkingHours', 'updateNonAvailabilityWorkHours']);
        bHClientSpy.uploadWorkHours.and.returnValue(of(new UploadWorkHoursResponse({ failed_usernames: [] })));
        bHClientSpy.uploadNonWorkingHours.and.returnValue(of(new UploadNonWorkingHoursResponse({ failed_usernames: [] })));
        bHClientSpy.updateNonAvailabilityWorkHours.and.returnValue(of(undefined));
        loggerSpy = jasmine.createSpyObj('Logger', ['debug', 'error']);

        await TestBed.configureTestingModule({
            declarations: [EditWorkHoursComponent],
            providers: [
                { provide: BHClient, useValue: bHClientSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditWorkHoursComponent);
        component = fixture.componentInstance;
        component.todayDate = new Date(2021, 1, 1);
        component.dataChange = jasmine.createSpyObj('dataChange', ['emit']);
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
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('setSearchResult', () => {
        it('should assign event to results property', () => {
            const parameter: Array<VhoWorkHoursResponse> = [];
            component.hoursType = HoursType.WorkingHours;
            component.setSearchResult({ result: parameter, refresh: false });
            expect(component).toBeTruthy();
            expect(component.result).toBe(parameter);
        });

        it('should show work hours table when work hours results found', () => {
            const parameter: Array<VhoWorkHoursResponse> = [];
            parameter.push(new VhoWorkHoursResponse());
            component.hoursType = HoursType.WorkingHours;
            component.setSearchResult({ result: parameter, refresh: false });
            expect(component.showWorkHoursTable).toBe(true);
            expect(component.showNonWorkHoursTable).toBe(false);
        });

        it('should not show non work hours table when result is null', () => {
            component.hoursType = HoursType.NonWorkingHours;
            component.setSearchResult({ result: null, refresh: false });
            expect(component.showWorkHoursTable).toBe(false);
            expect(component.showNonWorkHoursTable).toBe(false);
        });

        it('should show non work hours table when non work hours selected', () => {
            const parameter: Array<VhoNonAvailabilityWorkHoursResponse> = [];
            parameter.push(new VhoNonAvailabilityWorkHoursResponse());
            component.hoursType = HoursType.NonWorkingHours;
            component.setSearchResult({ result: parameter, refresh: false });
            expect(component.showWorkHoursTable).toBe(false);
            expect(component.showNonWorkHoursTable).toBe(true);
        });

        it('should clear update non-working hour confirmation messages after searching for work hours', () => {
            component.showSaveNonWorkHoursFailedPopup = true;
            component.isUploadNonWorkHoursSuccessful = true;
            const parameter: Array<VhoWorkHoursResponse> = [];
            parameter.push(new VhoWorkHoursResponse());
            component.setSearchResult({ result: parameter, refresh: false });
            assertConfirmationMessagesForSaveNonWorkHoursAreCleared();
        });

        it('should clear update non-working hour confirmation messages after searching for non-work hours', () => {
            component.showSaveNonWorkHoursFailedPopup = true;
            component.isUploadNonWorkHoursSuccessful = true;
            const parameter: Array<VhoNonAvailabilityWorkHoursResponse> = [];
            parameter.push(new VhoNonAvailabilityWorkHoursResponse());
            component.setSearchResult({ result: parameter, refresh: false });
            assertConfirmationMessagesForSaveNonWorkHoursAreCleared();
        });
    });

    describe('setHoursType', () => {
        it('should assign event to hoursType property', () => {
            const hoursType = HoursType.NonWorkingHours;
            component.setHoursType(hoursType);
            expect(component).toBeTruthy();
            expect(component.hoursType).toBe(hoursType);
        });
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
            component.vhoWorkHoursTableComponent = new VhoWorkHoursTableComponent(videoServiceSpy);

            component.onSaveWorkHours([]);

            expect(component.isUploadWorkHoursFailure).toBeTruthy();
            expect(component.vhoWorkHoursTableComponent.isEditing).toBeTruthy();
            expect(loggerSpy.error).toHaveBeenCalled();
        });
    });

    describe('save non work hours', () => {
        it('should call api to update non work hours', () => {
            const username = 'username@test.com';
            component.username = username;
            const nonWorkHours: EditVhoNonAvailabilityWorkHoursModel[] = [];
            const nonWorkHour1 = new EditVhoNonAvailabilityWorkHoursModel();
            nonWorkHour1.id = 1;
            nonWorkHour1.start_date = '2022-01-01';
            nonWorkHour1.start_time = '08:00:00';
            nonWorkHour1.end_date = '2022-01-01';
            nonWorkHour1.end_time = '10:00:00';
            const nonWorkHour2 = new EditVhoNonAvailabilityWorkHoursModel();
            nonWorkHour2.id = 2;
            nonWorkHour2.start_date = '2022-02-10';
            nonWorkHour2.start_time = '20:00:00';
            nonWorkHour2.end_date = '2022-02-11';
            nonWorkHour2.end_time = '08:30:00';
            nonWorkHours.push(nonWorkHour1);
            nonWorkHours.push(nonWorkHour2);
            spyOn(component.saveNonWorkHoursCompleted$, 'next');

            component.onSaveNonWorkHours(nonWorkHours);

            const mappedWorkHours: NonWorkingHours[] = [];
            mappedWorkHours.push(
                new NonWorkingHours({
                    id: 1,
                    start_time: new Date(2022, 0, 1, 8, 0, 0, 0),
                    end_time: new Date(2022, 0, 1, 10, 0, 0, 0)
                })
            );
            mappedWorkHours.push(
                new NonWorkingHours({
                    id: 2,
                    start_time: new Date(2022, 1, 10, 20, 0, 0, 0),
                    end_time: new Date(2022, 1, 11, 8, 30, 0, 0)
                })
            );
            const request = new UpdateNonWorkingHoursRequest({
                hours: mappedWorkHours
            });
            expect(bHClientSpy.updateNonAvailabilityWorkHours).toHaveBeenCalled();
            expect(bHClientSpy.updateNonAvailabilityWorkHours).toHaveBeenCalledWith(username, request);
            expect(component.showSaveNonWorkHoursFailedPopup).toBe(false);
            expect(component.isUploadNonWorkHoursSuccessful).toBe(true);
            expect(component.saveNonWorkHoursCompleted$.next).toHaveBeenCalledWith(true);
        });

        it('should handle api call error', () => {
            const username = 'username@test.com';
            component.username = username;
            const nonWorkHours: EditVhoNonAvailabilityWorkHoursModel[] = [];
            const nonWorkHour = new EditVhoNonAvailabilityWorkHoursModel();
            nonWorkHour.id = 1;
            nonWorkHour.start_date = '2022-01-01';
            nonWorkHour.start_time = '08:00:00';
            nonWorkHour.end_date = '2022-01-01';
            nonWorkHour.end_time = '10:00:00';
            nonWorkHours.push(nonWorkHour);
            bHClientSpy.updateNonAvailabilityWorkHours.and.returnValue(throwError(new Error()));
            spyOn(component.saveNonWorkHoursCompleted$, 'next');

            component.onSaveNonWorkHours(nonWorkHours);

            expect(component.showSaveNonWorkHoursFailedPopup).toBe(true);
            expect(component.isUploadNonWorkHoursSuccessful).toBe(false);
            expect(component.saveNonWorkHoursCompleted$.next).toHaveBeenCalledWith(false);
            expect(loggerSpy.error).toHaveBeenCalled();
        });
    });

    describe('onEditNonWorkHours', () => {
        it('should clear update non-working hour confirmation messages', () => {
            component.showSaveNonWorkHoursFailedPopup = true;
            component.isUploadNonWorkHoursSuccessful = true;
            component.onEditNonWorkHours();

            assertConfirmationMessagesForSaveNonWorkHoursAreCleared();
        });
    });

    describe('onCancelSaveNonWorkHours', () => {
        it('should clear update non-working hour confirmation messages', () => {
            component.showSaveNonWorkHoursFailedPopup = true;
            component.isUploadNonWorkHoursSuccessful = true;
            component.onCancelSaveNonWorkHours();

            assertConfirmationMessagesForSaveNonWorkHoursAreCleared();
        });
    });

    describe('onEditWorkHours', () => {
        it('should clear update working hour confirmation messages', () => {
            component.isUploadWorkHoursFailure = true;
            component.isUploadWorkHoursSuccessful = true;
            component.onEditWorkHours();

            assertConfirmationMessagesForSaveWorkHoursAreCleared();
        });
    });

    describe('onCancelSaveWorkHours', () => {
        it('should clear update working hour confirmation messages', () => {
            component.isUploadWorkHoursFailure = true;
            component.isUploadWorkHoursSuccessful = true;
            component.onCancelSaveWorkHours();

            assertConfirmationMessagesForSaveWorkHoursAreCleared();
        });
    });

    describe('dataChange', () => {
        it('should clear update non-working hour confirmation messages', () => {
            component.dataChanged(true);

            expect(component.dataChange.emit).toHaveBeenCalledWith(true);
        });
    });

    describe('filter by future date', () => {
        it('should show vho future data ', () => {
            component.todayDate = new Date('2022/07/25');
            const input = [
                new VhoNonAvailabilityWorkHoursResponse({ id: 0, start_time: new Date('2021/07/30'), end_time: new Date('2022/07/30') }),
                new VhoNonAvailabilityWorkHoursResponse({ id: 1, start_time: new Date('2022/07/25'), end_time: new Date('2022/07/26') }),
                new VhoNonAvailabilityWorkHoursResponse({ id: 2, start_time: new Date('2022/06/25'), end_time: new Date('2022/06/25') })
            ];
            const result = component.filterByFutureDate(input);
            expect(result.length).toBe(2);
            expect(result).toContain(input[0]);
            expect(result).toContain(input[1]);
        });
    });

    function assertConfirmationMessagesForSaveNonWorkHoursAreCleared() {
        expect(component.showSaveNonWorkHoursFailedPopup).toBe(false);
        expect(component.isUploadNonWorkHoursSuccessful).toBe(false);
    }

    function assertConfirmationMessagesForSaveWorkHoursAreCleared() {
        expect(component.isUploadWorkHoursFailure).toBe(false);
        expect(component.isUploadWorkHoursSuccessful).toBe(false);
    }
});
