import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllocateHearingsComponent } from './allocate-hearings.component';
import { ActivatedRoute } from '@angular/router';
import { ActivatedRouteStub } from '../../testing/stubs/activated-route-stub';
import { FormBuilder } from '@angular/forms';
import { JusticeUsersMenuComponent } from '../../shared/menus/justice-users-menu/justice-users-menu.component';
import { CaseTypesMenuComponent } from '../../shared/menus/case-types-menu/case-types-menu.component';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { Logger } from '../../services/logger';
import { of } from 'rxjs';
import { AllocationHearingsResponse } from '../../services/clients/api-client';
import {AllocateHearingsService} from '../services/allocate-hearings.service';

describe('AllocateHearingsComponent', () => {
    let component: AllocateHearingsComponent;
    let fixture: ComponentFixture<AllocateHearingsComponent>;
    let activatedRoute: ActivatedRouteStub;
    let allocateServiceSpy: jasmine.SpyObj<AllocateHearingsService>;
    const loggerMock = jasmine.createSpyObj('Logger', ['debug']);
    const hearingServiceMock = jasmine.createSpyObj('VideoHearingsService', ['getUsers', 'getHearingTypes']);
    const bookingPersistMock = jasmine.createSpyObj('BookingPersistService', ['selectedUsers', 'selectedCaseTypes']);

    beforeEach(async () => {
        activatedRoute = new ActivatedRouteStub();
        allocateServiceSpy = jasmine.createSpyObj('AllocateHearingsService', ['getAllocationHearings']);

        await TestBed.configureTestingModule({
            declarations: [AllocateHearingsComponent, JusticeUsersMenuComponent, CaseTypesMenuComponent],
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
            expect(component.hearings).toEqual(responseObj);
            expect(component.displayMessage).toBe(false);
        });

        it('should call the allocate service and return 0 rows', () => {
            const responseObj: AllocationHearingsResponse[] = [];

            allocateServiceSpy.getAllocationHearings.and.returnValue(of(responseObj));

            component.searchForHearings();

            expect(allocateServiceSpy.getAllocationHearings).toHaveBeenCalled();
            expect(component.hearings.length).toBe(0);
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
            expect(component.hearings.length).toBe(20);
            expect(component.message).toBe('Showing only 20 Records, For more records please apply filter');
            expect(component.displayMessage).toBe(true);
        });
    });

    describe('clear', () => {
        it('Should call clear functions and clear drop down values', () => {
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
});
