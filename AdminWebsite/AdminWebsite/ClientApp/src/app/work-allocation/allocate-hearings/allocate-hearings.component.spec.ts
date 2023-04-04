import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AllocateHearingsComponent } from './allocate-hearings.component';
import { ActivatedRoute } from '@angular/router';
import { ActivatedRouteStub } from '../../testing/stubs/activated-route-stub';
import { FormBuilder } from '@angular/forms';
import { AllocateHearingsService } from '../services/allocate-hearings.service';
import { of, throwError } from 'rxjs';
import { AllocationHearingsResponse, BookHearingException } from '../../services/clients/api-client';
import { By } from '@angular/platform-browser';
import { MinutesToHoursPipe } from '../../shared/pipes/minutes-to-hours.pipe';
import { AllocateHearingItemModel, AllocateHearingModel } from './models/allocate-hearing.model';
import { newGuid } from '@microsoft/applicationinsights-core-js';
import { Constants } from 'src/app/common/constants';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { SharedModule } from '../../shared/shared.module';
import { Logger } from 'src/app/services/logger';
import { SelectComponent, SelectOption } from 'src/app/shared/select';

describe('AllocateHearingsComponent', () => {
    let component: AllocateHearingsComponent;
    let fixture: ComponentFixture<AllocateHearingsComponent>;
    let activatedRoute: ActivatedRouteStub;
    let allocateServiceSpy: jasmine.SpyObj<AllocateHearingsService>;
    let testData: AllocationHearingsResponse[];

    const loggerMock = jasmine.createSpyObj('Logger', ['debug']);
    const hearingServiceMock = jasmine.createSpyObj('VideoHearingsService', ['getUsers', 'getHearingTypes']);
    const justiceUsersServiceMock = jasmine.createSpyObj('JusticeUsersService', ['retrieveJusticeUserAccounts']);

    beforeEach(async () => {
        testData = [
            new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: null,
                scheduled_date_time: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '2',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '3',
                allocated_cso: 'john@cso.com',
                scheduled_date_time: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '4',
                allocated_cso: 'tl@cso.com',
                scheduled_date_time: new Date()
            })
        ];

        activatedRoute = new ActivatedRouteStub();
        allocateServiceSpy = jasmine.createSpyObj('AllocateHearingsService', ['getAllocationHearings', 'allocateCsoToHearings']);
        await TestBed.configureTestingModule({
            declarations: [AllocateHearingsComponent, MinutesToHoursPipe],
            providers: [
                FormBuilder,
                { provide: ActivatedRoute, useValue: activatedRoute },
                { provide: AllocateHearingsService, useValue: allocateServiceSpy },
                DatePipe,
                { provide: JusticeUsersService, useValue: justiceUsersServiceMock },
                { provide: VideoHearingsService, useValue: hearingServiceMock },
                { provide: Logger, useValue: loggerMock },
                HttpClient,
                HttpHandler
            ],
            imports: [SharedModule]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AllocateHearingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.selectAllocateCso = TestBed.createComponent(SelectComponent).componentInstance as SelectComponent;
    });

    describe('ngOnInit', () => {
        let searchForHearingsSpy;

        justiceUsersServiceMock.retrieveJusticeUserAccounts.and.returnValue(of([]));
        hearingServiceMock.getHearingTypes.and.returnValue(of(['Type1', 'Type2']));

        beforeEach(() => {
            searchForHearingsSpy = spyOn(component, 'searchForHearings');
            searchForHearingsSpy.calls.reset();
            component.form.reset();
        });

        it('should be called with unallocated "today" parameters', () => {
            activatedRoute.testParams = { fromDt: '2023-01-13' };
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(searchForHearingsSpy).toHaveBeenCalled();
            expect(component.form.controls['isUnallocated'].value).toBe(true);
            expect(component.form.controls['fromDate'].value).toBe('2023-01-13');
            expect(component.form.controls['toDate'].value).toBeNull();
        });
        it('should be called with unallocated "tomorrow" parameters', () => {
            activatedRoute.testParams = { fromDt: '2023-01-14' };
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(searchForHearingsSpy).toHaveBeenCalled();
            expect(component.form.controls['isUnallocated'].value).toBe(true);
            expect(component.form.controls['fromDate'].value).toBe('2023-01-14');
            expect(component.form.controls['toDate'].value).toBeNull();
        });
        it('should be called with unallocated "week" parameters', () => {
            activatedRoute.testParams = { fromDt: '2023-01-01', toDt: '2023-01-07' };
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(searchForHearingsSpy).toHaveBeenCalled();
            expect(component.form.controls['isUnallocated'].value).toBe(true);
            expect(component.form.controls['fromDate'].value).toBe('2023-01-01');
            expect(component.form.controls['toDate'].value).toBe('2023-01-07');
        });
        it('should be called with unallocated "month" parameters', () => {
            activatedRoute.testParams = { fromDt: '2023-01-01', toDt: '2023-01-31' };
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(searchForHearingsSpy).toHaveBeenCalled();
            expect(component.form.controls['isUnallocated'].value).toBe(true);
            expect(component.form.controls['fromDate'].value).toBe('2023-01-01');
            expect(component.form.controls['toDate'].value).toBe('2023-01-31');
        });
        it('should be called with no parameter', () => {
            activatedRoute.testParams = {};
            component.ngOnInit();
            expect(component).toBeTruthy();
            expect(searchForHearingsSpy).toHaveBeenCalledTimes(0);
            expect(component.form.controls['isUnallocated'].value).toBeNull();
            expect(component.form.controls['fromDate'].value).toBeNull();
            expect(component.form.controls['toDate'].value).toBeNull();
        });
    });

    describe('searchForHearings', () => {
        it('should call the allocate service and return response', () => {
            component.form.controls['fromDate'].setValue('2023-01-13');
            component.form.controls['toDate'].setValue('2023-01-14');
            component.csoDropDownValues = ['test', 'user'];
            component.caseTypeDropDownValues = ['test', 'case', 'type'];
            component.form.controls['caseNumber'].setValue('testCaseNumber1234');
            component.form.controls['isUnallocated'].setValue(true);

            const responseObj = [new AllocationHearingsResponse()];
            allocateServiceSpy.getAllocationHearings.and.returnValue(of(responseObj));

            component.searchForHearings();

            expect(allocateServiceSpy.getAllocationHearings).toHaveBeenCalledWith(
                new Date('2023-01-13'),
                new Date('2023-01-14'),
                ['test', 'user'],
                ['test', 'case', 'type'],
                'testCaseNumber1234',
                true
            );
            expect(component.allocationHearingViewModel.originalState).toEqual(responseObj);
            expect(component.displayMessage).toBe(false);
        });

        it('should call the allocate service and return response when no allocated CSOs are selected', () => {
            component.onJusticeUserForFilterSelected([]);
            component.form.controls['fromDate'].setValue('2023-01-13');
            component.form.controls['toDate'].setValue('2023-01-14');
            component.caseTypeDropDownValues = ['test', 'case', 'type'];
            component.form.controls['caseNumber'].setValue('testCaseNumber1234');
            component.form.controls['isUnallocated'].setValue(true);
            const responseObj = [new AllocationHearingsResponse()];
            allocateServiceSpy.getAllocationHearings.and.returnValue(of(responseObj));

            component.searchForHearings();

            expect(allocateServiceSpy.getAllocationHearings).toHaveBeenCalledWith(
                new Date('2023-01-13'),
                new Date('2023-01-14'),
                [],
                ['test', 'case', 'type'],
                'testCaseNumber1234',
                true
            );
            expect(component.allocationHearingViewModel.originalState).toEqual(responseObj);
            expect(component.displayMessage).toBe(false);
        });

        it('should call the allocate service and return 0 rows', () => {
            const responseObj: AllocationHearingsResponse[] = [];

            allocateServiceSpy.getAllocationHearings.and.returnValue(of(responseObj));

            component.searchForHearings();

            expect(allocateServiceSpy.getAllocationHearings).toHaveBeenCalled();
            expect(component.allocationHearingViewModel.originalState.length).toBe(0);
            expect(component.message).toBe('There are no records found');
            expect(component.displayMessage).toBe(true);
        });

        it('should call the allocate service and return more than 20 rows', () => {
            const responseObj: AllocationHearingsResponse[] = [];

            for (let i = 0; i < 30; i++) {
                responseObj.push(new AllocationHearingsResponse());
            }

            allocateServiceSpy.getAllocationHearings.and.returnValue(of(responseObj));

            component.searchForHearings();

            expect(allocateServiceSpy.getAllocationHearings).toHaveBeenCalled();
            expect(component.allocationHearingViewModel.originalState.length).toBe(20);
            expect(component.message).toBe('Showing only 20 Records, For more records please apply filter');
            expect(component.displayMessage).toBe(true);
        });

        it('should call the allocate service and return only future hearings if date range no set', () => {
            const responseObj: AllocationHearingsResponse[] = [];
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const hearing = new AllocationHearingsResponse();
                hearing.hearing_id = i.toString();
                hearing.scheduled_date_time = today;
                responseObj.push(hearing);
            }

            allocateServiceSpy.getAllocationHearings.and.returnValue(of(responseObj));

            component.searchForHearings();

            const datePipe = new DatePipe('en-GB');

            expect(allocateServiceSpy.getAllocationHearings).toHaveBeenCalled();
            expect(component.form.value.fromDate).toEqual(datePipe.transform(today, 'yyyy-MM-dd'));
            expect(component.allocationHearingViewModel.originalState.length).toBe(20);
            expect(component.message).toBe('Showing only 20 Records, For more records please apply filter');
            expect(component.displayMessage).toBe(true);
            expect(allocateServiceSpy.getAllocationHearings).toHaveBeenCalled();
        });

        it('should map selected options for case types to id array', () => {
            const id = newGuid();
            const id2 = newGuid();
            const label = '';
            component.onCaseTypeSelected([
                { entityId: id, label },
                { entityId: id2, label }
            ]);
            expect(component.caseTypeDropDownValues.includes(id)).toBe(true);
            expect(component.caseTypeDropDownValues.includes(id2)).toBe(true);
            expect(component.caseTypeDropDownValues.length).toBe(2);
        });
    });

    describe('clear', () => {
        it('Should call clear functions and clear drop down values', () => {
            component.allocationHearingViewModel = new AllocateHearingModel([
                new AllocationHearingsResponse(),
                new AllocationHearingsResponse()
            ]);
            component.form.controls['fromDate'].setValue('2023-01-13');
            component.form.controls['toDate'].setValue('2023-01-14');
            component.form.controls['userName'].setValue(['test', 'user']);
            component.form.controls['caseType'].setValue(['test', 'case', 'type']);
            component.form.controls['caseNumber'].setValue('testCaseNumber1234');
            component.form.controls['isUnallocated'].setValue(true);
            component.selectFilterCso = new SelectComponent(loggerMock);
            component.selectCaseType = new SelectComponent(loggerMock);

            const caseMenuSpy = spyOn(component.selectFilterCso, 'clear');
            const csoMenuSpy = spyOn(component.selectCaseType, 'clear');

            component.clear();

            expect(component.allocationHearingViewModel.originalState.length).toBe(0);
            expect(caseMenuSpy).toHaveBeenCalled();
            expect(csoMenuSpy).toHaveBeenCalled();
            expect(component.form.controls['fromDate'].value).toBe('');
            expect(component.form.controls['toDate'].value).toBe('');
            expect(component.form.controls['userName'].value).toBe('');
            expect(component.form.controls['caseType'].value).toBe('');
            expect(component.form.controls['caseNumber'].value).toBe('');
            expect(component.form.controls['isUnallocated'].value).toBe(false);
            expect(component.csoDropDownValues).toEqual([]);
            expect(component.caseTypeDropDownValues).toEqual([]);
        });

        it('should clear and disable cso menu when IsAllocated filter checkbox is checked', () => {
            component.selectFilterCso = new SelectComponent(loggerMock);
            const csoFilterClearSpy = spyOn(component.selectFilterCso, 'clear');
            const csoFilterDisabledSpy = spyOn(component.selectFilterCso, 'disable');

            component.form.get('isUnallocated').setValue(true);

            expect(csoFilterClearSpy).toHaveBeenCalled();
            expect(csoFilterDisabledSpy).toHaveBeenCalled();
        });

        it('should enable cso menu when IsAllocated filter checkbox is not checked', () => {
            component.selectFilterCso = new SelectComponent(loggerMock);
            const csoFilterClearSpy = spyOn(component.selectFilterCso, 'clear');
            const csoFilterEnabledSpy = spyOn(component.selectFilterCso, 'enable');

            component.form.get('isUnallocated').setValue(false);

            expect(csoFilterClearSpy).toHaveBeenCalledTimes(0);
            expect(csoFilterEnabledSpy).toHaveBeenCalled();
        });
    });

    describe('Manual allocation', () => {
        it('should unset isAllocated when cso filter is selected', () => {
            component.form.get('isUnallocated').setValue(true);
            component.onJusticeUserForFilterSelected([{ entityId: '1234', label: '' }]);
            expect(component.form.get('isUnallocated').value).toBeFalsy();
        });

        it('should assign cso to selected hearings when cso has been selected', () => {
            // arrange
            component.allocationHearingViewModel = new AllocateHearingModel(testData);

            const hearingId = testData[0].hearing_id;
            const csoId = newGuid();
            const username = 'test@cso.com';

            // act
            component.selectHearing(true, hearingId);

            // mimic cso selection
            component.onJusticeUserForAllocationSelected({ entityId: csoId, data: username, label: '' });

            // assert
            const postUpdateHearing = component.allocationHearingViewModel.hearings.find(x => x.hearingId === hearingId);
            expect(component.allocationHearingViewModel.hasSelectedHearings).toBeTruthy();
            expect(component.allocationHearingViewModel.hasPendingChanges).toBeTruthy();
            expect(postUpdateHearing.allocatedOfficerId).toBe(csoId);
            expect(postUpdateHearing.allocatedOfficerUsername).toBe(username);
        });

        it('should reset hearing when hearing has been unchecked', () => {
            // arrange
            component.allocationHearingViewModel = new AllocateHearingModel(testData);

            const hearingId = testData[0].hearing_id;
            const originalUsername = testData[0].allocated_cso;
            const csoId = newGuid();
            const username = 'test@cso.com';

            const items: SelectOption[] = [{ label: '', entityId: csoId, data: username }];
            component.selectAllocateCso.items = items;
            component.selectAllocateCso.selectedEntityIds = [csoId];
            component.selectAllocateCso.handleOnChange();

            // act
            // first allocate all hearings
            component.toggleAll(true);
            fixture.detectChanges();

            const postUpdateHearing = component.allocationHearingViewModel.hearings.find(x => x.hearingId === hearingId);
            expect(postUpdateHearing.allocatedOfficerUsername).toBe(username);

            const matchingElements = fixture.debugElement.queryAll(By.css('[id^=cso_]'));
            expect(matchingElements.every(x => (<HTMLTableCellElement>x.nativeElement).innerText === username)).toBeTruthy();

            // then uncheck one
            component.selectHearing(false, hearingId);
            fixture.detectChanges();

            const postRevertedHearing = component.allocationHearingViewModel.hearings.find(x => x.hearingId === hearingId);
            expect(postRevertedHearing.allocatedOfficerUsername).toBe(originalUsername);

            // then toggle all off
            component.toggleAll(false);
            fixture.detectChanges();
            expect(component.allocationHearingViewModel.originalState).toEqual(testData);
            const revertedMatchingElements = fixture.debugElement.queryAll(By.css('[id^=cso_]'));
            expect(revertedMatchingElements.every(x => (<HTMLTableCellElement>x.nativeElement).innerText !== username)).toBeTruthy();
        });

        it('should update original data when allocation has been confirmed', fakeAsync(() => {
            // arrange
            component.allocationHearingViewModel = new AllocateHearingModel(testData);

            const hearingId = testData[0].hearing_id;
            const csoId = newGuid();
            const username = 'test@cso.com';

            const items: SelectOption[] = [{ label: '', entityId: csoId, data: username }];
            component.selectAllocateCso.items = items;
            component.selectAllocateCso.selectedEntityIds = [csoId];
            component.selectAllocateCso.handleOnChange();

            const updatedAllocation = new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: username,
                scheduled_date_time: new Date()
            });

            allocateServiceSpy.allocateCsoToHearings.and.returnValue(of([updatedAllocation]));

            // act
            component.selectHearing(true, hearingId);

            // mimic cso selection
            component.onJusticeUserForAllocationSelected({ entityId: csoId, label: '' });

            component.confirmAllocation();
            tick();

            // assert
            expect(component.allocationHearingViewModel.areAllChecked).toBeFalsy();
            expect(component.allocationHearingViewModel.hasPendingChanges).toBeFalsy();
            expect(component.allocationHearingViewModel.selectedHearingIds.length).toBe(0);
            expect(component.allocationHearingViewModel.hearings[0].allocatedOfficerUsername).toBe(username);
        }));

        it('should clear previous message when allocation has been confirmed', fakeAsync(() => {
            // arrange
            component.allocationHearingViewModel = new AllocateHearingModel(testData);

            const hearingId = testData[0].hearing_id;
            const csoId = newGuid();
            const username = 'test@cso.com';

            const items: SelectOption[] = [{ label: '', entityId: csoId, data: username }];
            component.selectAllocateCso.items = items;
            component.selectAllocateCso.selectedEntityIds = [csoId];
            component.selectAllocateCso.handleOnChange();

            const updatedAllocation = new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: username,
                scheduled_date_time: new Date()
            });

            allocateServiceSpy.allocateCsoToHearings.and.returnValue(of([updatedAllocation]));
            const spy = spyOn(component, 'clearHearingUpdatedMessage');

            // act
            component.selectHearing(true, hearingId);
            component.onJusticeUserForAllocationSelected({ entityId: csoId, label: '' });
            component.confirmAllocation();
            tick();

            // assert
            expect(spy).toHaveBeenCalled();
            expect(component.message).toBe('Hearings have been updated.');
        }));

        it('should display error when confirmation fails', fakeAsync(() => {
            const responseObj = [new AllocationHearingsResponse()];
            allocateServiceSpy.getAllocationHearings.and.returnValue(of(responseObj));
            const csoId = newGuid();

            const items: SelectOption[] = [{ label: '', entityId: csoId }];
            component.selectAllocateCso.items = items;
            component.selectAllocateCso.selectedEntityIds = [csoId];
            component.selectAllocateCso.handleOnChange();

            const error = new BookHearingException('Bad Request', 500, 'invalid id', null, null);
            allocateServiceSpy.allocateCsoToHearings.and.returnValue(throwError(error));

            component.confirmAllocation();
            tick();

            expect(component.displayMessage).toBeTruthy();
            expect(component.message).toBe('One or more hearings could not be allocated successfully.');
        }));

        it('should reset when allocation has been cancelled', fakeAsync(() => {
            // arrange
            component.allocationHearingViewModel = new AllocateHearingModel(testData);

            const hearingId = testData[0].hearing_id;
            const csoId = newGuid();

            // act
            component.selectHearing(true, hearingId);

            component.cancelAllocation();

            expect(component.allocationHearingViewModel.areAllChecked).toBeFalsy();
            expect(component.allocationHearingViewModel.originalState).toEqual(testData);
        }));

        it('should reset when allocate to CSO is cleared', fakeAsync(() => {
            // arrange
            component.allocationHearingViewModel = new AllocateHearingModel(testData);

            const hearingId = testData[0].hearing_id;

            // act
            component.selectHearing(true, hearingId);

            // mimic cso selection clear
            component.onJusticeUserForAllocationSelected();

            expect(component.allocationHearingViewModel.areAllChecked).toBeFalsy();
            expect(component.allocationHearingViewModel.originalState).toEqual(testData);
            expect(component.displayMessage).toBeFalsy();
            expect(component.message).toBe('');
        }));
    });

    describe('allocate hearings icon', () => {
        it('should show clock icon if there is nonavailability clash', () => {
            component.allocationHearingViewModel.hearings = [
                new AllocateHearingItemModel(
                    'hearingid',
                    new Date(),
                    10,
                    'casenumber',
                    'casetype',
                    'allocatedOfficerUserName',
                    false,
                    0,
                    true
                )
            ];
            fixture.detectChanges();
            const debugElement = fixture.debugElement;
            const clockIcon = debugElement.query(By.css('#clockIcon')).nativeElement;
            expect(clockIcon).toBeTruthy();
        });
        it('should not show clock icon if there is nonavailability clash', () => {
            component.allocationHearingViewModel.hearings = [
                new AllocateHearingItemModel(
                    'hearingid',
                    new Date(),
                    10,
                    'casenumber',
                    'casetype',
                    'allocatedOfficerUserName',
                    false,
                    0,
                    false
                )
            ];
            fixture.detectChanges();
            const debugElement = fixture.debugElement;
            const clockIcon = debugElement.query(By.css('#clockIcon'))?.nativeElement;
            expect(clockIcon).toBeFalsy();
        });
    });

    describe('Clear Hearing Updated Message', () => {
        const HEARING_HAVE_BEEN_UPDATED = Constants.AllocateHearings.ConfirmationMessage;
        const OTHER_MESSAGES = 'Other messages';

        it('should return true when message is equal to "Hearings have been updated." ', () => {
            // Given
            component.message = HEARING_HAVE_BEEN_UPDATED;
            // When
            const res = component.hasHearingBeenUpdated();
            // Then
            expect(res).toBe(true);
        });
        it('should return false when message is not equal to "Hearings have been updated." ', () => {
            // Given
            component.message = OTHER_MESSAGES;
            // When
            const res = component.hasHearingBeenUpdated();
            // Then
            expect(res).toBe(false);
        });
        it('should clear the message when message is equal to "Hearings have been updated." ', () => {
            // Given
            component.message = HEARING_HAVE_BEEN_UPDATED;
            const spy = spyOn(component, 'clearMessage');
            // When
            component.clearHearingUpdatedMessage();
            // Then
            expect(spy).toHaveBeenCalled();
        });
        it('should not clear the message when message is not equal to "Hearings have been updated." ', () => {
            // Given
            component.message = OTHER_MESSAGES;
            const spy = spyOn(component, 'clearMessage');
            // When
            component.clearHearingUpdatedMessage();
            // Then
            expect(spy).not.toHaveBeenCalled();
        });
    });
});
