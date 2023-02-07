import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AllocateHearingsComponent } from './allocate-hearings.component';
import { ActivatedRoute } from '@angular/router';
import { ActivatedRouteStub } from '../../testing/stubs/activated-route-stub';
import { FormBuilder } from '@angular/forms';
import { AllocateHearingsService } from '../services/allocate-hearings.service';
import { JusticeUsersMenuComponent } from '../../shared/menus/justice-users-menu/justice-users-menu.component';
import { CaseTypesMenuComponent } from '../../shared/menus/case-types-menu/case-types-menu.component';
import { of, throwError } from 'rxjs';
import { JusticeUserMenuStubComponent } from '../../testing/stubs/dropdown-menu/justice-user-menu-stub.component';
import { CaseTypeMenuStubComponent } from '../../testing/stubs/dropdown-menu/case-type-menu-stub.component';
import { AllocationHearingsResponse, BookHearingException } from '../../services/clients/api-client';
import { By } from '@angular/platform-browser';
import { MinutesToHoursPipe } from '../../shared/pipes/minutes-to-hours.pipe';
import { AllocateHearingModel } from './models/allocate-hearing.model';
import { newGuid } from '@microsoft/applicationinsights-core-js';

describe('AllocateHearingsComponent', () => {
    let component: AllocateHearingsComponent;
    let fixture: ComponentFixture<AllocateHearingsComponent>;
    let activatedRoute: ActivatedRouteStub;
    let allocateServiceSpy: jasmine.SpyObj<AllocateHearingsService>;
    let testData: AllocationHearingsResponse[];

    const loggerMock = jasmine.createSpyObj('Logger', ['debug']);
    const hearingServiceMock = jasmine.createSpyObj('VideoHearingsService', ['getUsers', 'getHearingTypes']);
    const bookingPersistMock = jasmine.createSpyObj('BookingPersistService', ['selectedUsers', 'selectedCaseTypes']);

    beforeEach(async () => {
        testData = [
            new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: null,
                hearing_date: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '2',
                allocated_cso: 'john@cso.com',
                hearing_date: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '3',
                allocated_cso: 'john@cso.com',
                hearing_date: new Date()
            }),
            new AllocationHearingsResponse({
                hearing_id: '4',
                allocated_cso: 'tl@cso.com',
                hearing_date: new Date()
            })
        ];

        activatedRoute = new ActivatedRouteStub();
        allocateServiceSpy = jasmine.createSpyObj('AllocateHearingsService', ['getAllocationHearings', 'setAllocationToHearings']);
        await TestBed.configureTestingModule({
            declarations: [AllocateHearingsComponent, JusticeUserMenuStubComponent, CaseTypeMenuStubComponent, MinutesToHoursPipe],
            providers: [
                FormBuilder,
                { provide: ActivatedRoute, useValue: activatedRoute },
                { provide: AllocateHearingsService, useValue: allocateServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AllocateHearingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.csoMenu = TestBed.createComponent(JusticeUserMenuStubComponent).componentInstance as JusticeUsersMenuComponent;
        component.caseTypeMenu = TestBed.createComponent(CaseTypeMenuStubComponent).componentInstance as CaseTypesMenuComponent;
        component.csoAllocatedMenu = TestBed.createComponent(JusticeUserMenuStubComponent).componentInstance as JusticeUsersMenuComponent;
    });

    describe('ngOnInit', () => {
        let searchForHearingsSpy;
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
            const formBuilder = new FormBuilder();
            component.csoMenu = new JusticeUsersMenuComponent(bookingPersistMock, hearingServiceMock, formBuilder, loggerMock);
            component.caseTypeMenu = new CaseTypesMenuComponent(bookingPersistMock, hearingServiceMock, formBuilder, loggerMock);

            const caseMenuSpy = spyOn(component.caseTypeMenu, 'clear');
            const csoMenuSpy = spyOn(component.csoMenu, 'clear');

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
    });

    describe('Manual allocation', () => {
        it('should assign cso to selected hearings when cso has been selected', () => {
            // arrange
            component.allocationHearingViewModel = new AllocateHearingModel(testData);

            const hearingId = testData[0].hearing_id;
            const csoId = newGuid();
            const username = 'test@cso.com';
            component.csoAllocatedMenu.selectedLabel = username;

            // act
            component.selectHearing(true, hearingId);

            // mimic cso selection
            component.onJusticeUserForAllocationSelected(csoId);

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
            component.csoAllocatedMenu['selectedItems'] = csoId;
            component.csoAllocatedMenu.selectedLabel = username;

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
            component.csoAllocatedMenu.selectedLabel = username;

            const updatedAllocation = new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: username,
                hearing_date: new Date()
            });

            allocateServiceSpy.allocateCsoToHearings.and.returnValue(of([updatedAllocation]));

            // act
            component.selectHearing(true, hearingId);

            // mimic cso selection
            component.onJusticeUserForAllocationSelected(csoId);

            component.confirmAllocation();
            tick();

            expect(component.allocationHearingViewModel.areAllChecked).toBeFalsy();
            expect(component.allocationHearingViewModel.hasPendingChanges).toBeFalsy();
            expect(component.allocationHearingViewModel.selectedHearingIds.length).toBe(0);
            expect(component.allocationHearingViewModel.hearings[0].allocatedOfficerUsername).toBe(username);
        }));

        it('should display error when confirmation fails', fakeAsync(() => {
            const responseObj = [new AllocationHearingsResponse()];
            allocateServiceSpy.getAllocationHearings.and.returnValue(of(responseObj));
            const csoId = newGuid();
            component.csoAllocatedMenu['selectedItems'] = csoId;

            const error = new BookHearingException('Bad Request', 500, 'invalid id', null, null);
            allocateServiceSpy.allocateCsoToHearings.and.returnValue(throwError(error));

            component.confirmAllocation();
            tick();

            expect(component.displayMessage).toBeTruthy();
            expect(component.message).toBe('One or more hearings could not be allocated successfully.');
        }));

        it('should reset whe allocation has been cancelled', fakeAsync(() => {
            // arrange
            component.allocationHearingViewModel = new AllocateHearingModel(testData);

            const hearingId = testData[0].hearing_id;
            const csoId = newGuid();
            const username = 'test@cso.com';
            component.csoAllocatedMenu.selectedLabel = username;

            const updatedAllocation = new AllocationHearingsResponse({
                hearing_id: '1',
                allocated_cso: username,
                hearing_date: new Date()
            });

            // act
            component.selectHearing(true, hearingId);

            // mimic cso selection
            component.onJusticeUserForAllocationSelected(csoId);

            component.cancelAllocation();

            expect(component.allocationHearingViewModel.areAllChecked).toBeFalsy();
            expect(component.allocationHearingViewModel.originalState).toEqual(testData);
        }));
    });
});
