import { HttpClientModule } from '@angular/common/http';
import { Component, Directive, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { AbstractControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import * as moment from 'moment';
import { MomentModule } from 'ngx-moment';
import { BehaviorSubject, of } from 'rxjs';
import { ConfigService } from 'src/app/services/config.service';
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { Logger } from 'src/app/services/logger';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { BookingsDetailsModel, BookingsListModel } from '../../common/model/bookings-list.model';
import { BookingsModel } from '../../common/model/bookings.model';
import { HearingModel } from '../../common/model/hearing.model';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import {
    BookingsByDateResponse,
    BookingsHearingResponse,
    BookingsResponse,
    HearingDetailsResponse,
    HearingVenueResponse,
    HearingTypeResponse
} from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingsListComponent } from './bookings-list.component';
import { DatePipe } from '@angular/common';
import { FeatureFlagService } from 'src/app/services/feature-flag.service';

let component: BookingsListComponent;
let bookingPersistService: BookingPersistService;
let fixture: ComponentFixture<BookingsListComponent>;
let bookingsListServiceSpy: jasmine.SpyObj<BookingsListService>;
bookingsListServiceSpy = jasmine.createSpyObj<BookingsListService>('BookingsListService', [
    'getBookingsList',
    'mapBookingsResponse',
    'addBookings',
    'replaceBookingRecord'
]);
let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;
videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingService', [
    'getCurrentRequest',
    'cancelRequest',
    'getHearingById',
    'mapHearingDetailsResponseToHearingModel',
    'getHearingTypes'
]);
let referenceDataServiceSpy: jasmine.SpyObj<ReferenceDataService>;
referenceDataServiceSpy = jasmine.createSpyObj('ReferenceDataService', ['getCourts', 'fetchPublicHolidays', 'getPublicHolidays']);
let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['flagChange']);
let returnUrlService: ReturnUrlService;
let featureFlagServiceSpy: jasmine.SpyObj<FeatureFlagService>;
featureFlagServiceSpy = jasmine.createSpyObj('FeatureFlagService', ['getFeatureFlagByName']);


export class ResponseTestData {
    getTestData(): BookingsResponse {
        const fixedDate = new Date('2019-10-22 13:58:40.3730067');
        const response = new BookingsResponse();
        const byDate = new BookingsByDateResponse();
        byDate.scheduled_date = fixedDate;
        byDate.hearings = new Array<BookingsHearingResponse>();

        const bhr = new BookingsHearingResponse({ hearing_date: fixedDate });
        bhr.hearing_id = '1';
        bhr.created_date = fixedDate;
        bhr.last_edit_date = fixedDate;
        bhr.scheduled_date_time = fixedDate;

        const bhr1 = new BookingsHearingResponse();
        bhr1.hearing_id = '2';

        byDate.hearings.push(bhr);
        byDate.hearings.push(bhr1);

        response.hearings = new Array<BookingsByDateResponse>();
        response.hearings.push(byDate);
        response.next_cursor = '12345670_3';
        return response;
    }
}

export class BookingslistTestData {
    getBookings(): BookingsModel {
        const model = new BookingsModel('1233');
        model.Hearings.push(this.getTestData());
        return model;
    }

    getBookings1(): BookingsModel {
        const model = new BookingsModel('1234');
        model.Hearings.push(this.getTestData1());
        return model;
    }

    getTestData(): BookingsListModel {
        const date = new Date('2019-10-22 00:00:00.0000000');
        const dateNoTime = new Date(date.setHours(0, 0, 0, 0));
        const model = new BookingsListModel(dateNoTime);
        const lists: Array<BookingsDetailsModel> = [];
        const b1 = new BookingsDetailsModel(
            '1',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason1',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        const b2 = new BookingsDetailsModel(
            '2',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason2',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        const b3 = new BookingsDetailsModel(
            '3',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason3',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        model.BookingsDetails = lists;
        return model;
    }

    getTestData1(): BookingsListModel {
        const date = new Date('2019-10-22 00:00:00.0000000');
        const dateNoTime = new Date(date.setHours(0, 0, 0, 0));
        const model = new BookingsListModel(dateNoTime);
        const lists: Array<BookingsDetailsModel> = [];
        const b1 = new BookingsDetailsModel(
            '1',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason4',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        const b2 = new BookingsDetailsModel(
            '2',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason5',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        const b3 = new BookingsDetailsModel(
            '6',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason6',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        model.BookingsDetails = lists;
        return model;
    }
}

export class ArrayBookingslistModelTestData {
    getTestData(): Array<BookingsListModel> {
        const listModel: Array<BookingsListModel> = [];
        const date = new Date('2019-10-22 00:00:00.0000000');
        const dateNoTime = new Date(date.setHours(0, 0, 0, 0));
        const model = new BookingsListModel(dateNoTime);
        const lists: Array<BookingsDetailsModel> = [];
        const b1 = new BookingsDetailsModel(
            '11',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason7',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        const b2 = new BookingsDetailsModel(
            '12',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason8',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        const b3 = new BookingsDetailsModel(
            '33',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason9',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        model.BookingsDetails = lists;
        const lists1: Array<BookingsDetailsModel> = [];
        const date1 = new Date('2019-11-22 00:00:00.0000000');
        const dateNoTime1 = new Date(date1.setHours(0, 0, 0, 0));
        const model1 = new BookingsListModel(dateNoTime1);
        const b11 = new BookingsDetailsModel(
            '44',
            new Date('2019-11-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason10',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        const b21 = new BookingsDetailsModel(
            '45',
            new Date('2019-11-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason11',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        const b31 = new BookingsDetailsModel(
            '46',
            new Date('2019-11-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason12',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );

        lists1.push(b11);
        lists1.push(b21);
        lists1.push(b31);
        model1.BookingsDetails = lists1;

        listModel.push(model);
        listModel.push(model1);
        return listModel;
    }
}

@Directive({ selector: '[appScrollable]' })
class ScrollableDirective {
    @Output() scrollPosition = new EventEmitter();
}

@Component({
    selector: 'app-booking-details',
    template: ''
})
class BookingDetailsComponent {}

export class BookingPersistServiceSpy {
    private _bookingList: Array<BookingsListModel> = [];
    private _nextCuror = '12345';
    private _selectedGroupIndex = 0;
    private _selectedItemIndex = 0;
    private _caseNumber = 'CASE_NUMBER';
    private _showSearch = false;
    private _noJudgeInHearings = false;

    get bookingList() {
        const listItem = new BookingslistTestData().getTestData();
        this._bookingList = [];
        this._bookingList.push(listItem);
        return this._bookingList;
    }

    set bookingList(value) {
        this._bookingList = value;
    }

    get nextCursor() {
        return this._nextCuror;
    }
    set nextCursor(value) {
        this._nextCuror = value;
    }
    get selectedGroupIndex() {
        return this._selectedGroupIndex;
    }
    get selectedItemIndex() {
        return this._selectedItemIndex;
    }
    set selectedGroupIndex(value) {
        this._selectedGroupIndex = value;
    }
    set selectedItemIndex(value) {
        this._selectedItemIndex = value;
    }

    get caseNumber(): string {
        return this._caseNumber;
    }

    set caseNumber(value) {
        this._caseNumber = value;
    }
    get showSearch(): boolean {
        return this._showSearch;
    }

    set showSearch(value) {
        this._showSearch = value;
    }

    get noJugdeInHearings(): boolean {
        return this._noJudgeInHearings;
    }

    set noJugdeInHearings(value) {
        this._noJudgeInHearings = value;
    }

    updateBooking(hearing: HearingModel) {
        const booking = new BookingsDetailsModel(
            '1',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason13',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        booking.IsStartTimeChanged = true;
        return booking;
    }
    resetAll() {}
}

let routerSpy: jasmine.SpyObj<Router>;
const configServiceSpy = jasmine.createSpyObj('ConfigService', ['getConfig']);
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn', 'info']);

describe('BookingsListComponent', () => {
    beforeEach(
        waitForAsync(() => {
            const data = new ResponseTestData().getTestData();

            bookingsListServiceSpy.getBookingsList.and.returnValue(of(data));
            const model1 = new BookingslistTestData().getBookings();
            const model2 = new BookingslistTestData().getBookings1();
            const listModel = new ArrayBookingslistModelTestData().getTestData();
            bookingsListServiceSpy.mapBookingsResponse.and.returnValues(model1, model1, model1, model2);
            bookingsListServiceSpy.addBookings.and.returnValue(listModel);
            routerSpy = jasmine.createSpyObj('Router', ['navigate']);

            videoHearingServiceSpy.getHearingById.and.returnValue(of(new HearingDetailsResponse()));
            videoHearingServiceSpy.getHearingTypes.and.returnValue(of(new Array<HearingTypeResponse>()));
            configServiceSpy.getConfig.and.returnValue({});
            launchDarklyServiceSpy.flagChange = new BehaviorSubject({ admin_search: true });
            referenceDataServiceSpy.getCourts.and.returnValue(of(new Array<HearingVenueResponse>()));
            featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(false));


            TestBed.configureTestingModule({
                declarations: [BookingsListComponent, ScrollableDirective, BookingDetailsComponent, LongDatetimePipe],
                imports: [HttpClientModule, MomentModule, ReactiveFormsModule, NgSelectModule],
                providers: [
                    FormBuilder,
                    ConfigService,
                    { provide: BookingsListService, useValue: bookingsListServiceSpy },
                    { provide: Router, useValue: routerSpy },
                    { provide: VideoHearingsService, useValue: videoHearingServiceSpy },
                    { provide: BookingPersistService, useClass: BookingPersistServiceSpy },
                    { provide: Logger, useValue: loggerSpy },
                    { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                    { provide: ReferenceDataService, useValue: referenceDataServiceSpy },
                    { provide: FeatureFlagService, useValue: featureFlagServiceSpy },
                    DatePipe
                ]
            }).compileComponents();

            fixture = TestBed.createComponent(BookingsListComponent);
            component = fixture.componentInstance;
            bookingPersistService = TestBed.inject(BookingPersistService);
            returnUrlService = TestBed.inject(ReturnUrlService);
            fixture.detectChanges();
        })
    );

    function setFormValue(noJudge?: boolean) {
        component.searchForm.controls['caseNumber'].setValue('CASE_NUMBER');
        component.searchForm.controls['selectedVenueIds'].setValue([1, 2]);
        component.searchForm.controls['selectedCaseTypes'].setValue(['Tribunal', 'Mental Health']);
        component.searchForm.controls['startDate'].setValue(moment().startOf('day').add(1, 'days').toDate());
        component.searchForm.controls['endDate'].setValue(moment().startOf('day').add(2, 'days').toDate());
        component.searchForm.controls['participantLastName'].setValue('PARTICIPANT_LAST_NAME');
        component.searchForm.controls['noJudge'].setValue(noJudge ?? false);
    }

    function clearSearch() {
        component.searchForm.controls['caseNumber'].setValue('');
        component.searchForm.controls['selectedVenueIds'].setValue([]);
        component.searchForm.controls['selectedCaseTypes'].setValue([]);
        component.searchForm.controls['startDate'].setValue(null);
        component.searchForm.controls['endDate'].setValue(null);
        component.searchForm.controls['participantLastName'].setValue('');
        component.searchForm.controls['noJudge'].setValue(false);
    }

    it('should create bookings list component', () => {
        expect(component).toBeTruthy();
    });

    it('should show bookings list records', () => {
        setFormValue();
        component.ngOnInit();
        expect(component.endOfData).toBeFalsy();
        expect(component.error).toBeFalsy();
        expect(component.recordsLoaded).toBeTruthy();
        expect(component.bookings.length).toBe(1);
        expect(component.loaded).toBeTruthy();
    });

    it('should onSearch (admin_search flag off)', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue();
        component.enableSearchFeature = false;
        component.onSearch();
        expect(bookingPersistService.caseNumber).toMatch('CASE_NUMBER');
        expect(bookingPersistService.selectedVenueIds).toEqual([1, 2]);
        expect(bookingPersistService.selectedCaseTypes).toEqual(['Tribunal', 'Mental Health']);
        expect(bookingPersistService.startDate).toEqual(moment().startOf('day').add(1, 'days').toDate());
        expect(bookingPersistService.endDate).toEqual(moment().startOf('day').add(2, 'days').toDate());
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(undefined, component.limit);
    });

    it('should onSearch (admin_search flag on)', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue();
        component.enableSearchFeature = true;
        component.onSearch();
        expect(bookingPersistService.caseNumber).toMatch('CASE_NUMBER');
        expect(bookingPersistService.participantLastName).toMatch('PARTICIPANT_LAST_NAME');
        expect(bookingPersistService.selectedVenueIds).toEqual([1, 2]);
        expect(bookingPersistService.selectedCaseTypes).toEqual(['Tribunal', 'Mental Health']);
        expect(bookingPersistService.startDate).toEqual(moment().startOf('day').add(1, 'days').toDate());
        expect(bookingPersistService.endDate).toEqual(moment().startOf('day').add(2, 'days').toDate());
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(
            undefined,
            component.limit,
            bookingPersistService.caseNumber,
            bookingPersistService.selectedVenueIds,
            bookingPersistService.selectedCaseTypes,
            moment(bookingPersistService.startDate).startOf('day').toDate(),
            moment(bookingPersistService.endDate).endOf('day').toDate(),
            bookingPersistService.participantLastName,
            bookingPersistService.noJugdeInHearings
        );
    });

    it('should onSearch (admin_search flag on) with populated endDate and empty startDate', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue();
        component.enableSearchFeature = true;
        component.searchForm.controls['startDate'].setValue(null);
        component.onSearch();
        expect(bookingPersistService.caseNumber).toMatch('CASE_NUMBER');
        expect(bookingPersistService.participantLastName).toMatch('PARTICIPANT_LAST_NAME');
        expect(bookingPersistService.selectedVenueIds).toEqual([1, 2]);
        expect(bookingPersistService.selectedCaseTypes).toEqual(['Tribunal', 'Mental Health']);
        expect(bookingPersistService.startDate).toBeNull();
        expect(bookingPersistService.endDate).toEqual(moment().startOf('day').add(2, 'days').toDate());
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(
            undefined,
            component.limit,
            bookingPersistService.caseNumber,
            bookingPersistService.selectedVenueIds,
            bookingPersistService.selectedCaseTypes,
            moment(bookingPersistService.endDate).startOf('day').toDate(),
            moment(bookingPersistService.endDate).endOf('day').toDate(),
            bookingPersistService.participantLastName,
            bookingPersistService.noJugdeInHearings
        );
    });

    it('should onSearch (admin_search flag on) with populated startDate and empty endDate', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue();
        component.enableSearchFeature = true;
        component.searchForm.controls['endDate'].setValue(null);
        component.onSearch();
        expect(bookingPersistService.caseNumber).toMatch('CASE_NUMBER');
        expect(bookingPersistService.participantLastName).toMatch('PARTICIPANT_LAST_NAME');
        expect(bookingPersistService.selectedVenueIds).toEqual([1, 2]);
        expect(bookingPersistService.selectedCaseTypes).toEqual(['Tribunal', 'Mental Health']);
        expect(bookingPersistService.startDate).toEqual(moment().startOf('day').add(1, 'days').toDate());
        expect(bookingPersistService.endDate).toBeNull();
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(
            undefined,
            component.limit,
            bookingPersistService.caseNumber,
            bookingPersistService.selectedVenueIds,
            bookingPersistService.selectedCaseTypes,
            moment(bookingPersistService.startDate).startOf('day').toDate(),
            moment(bookingPersistService.startDate).endOf('day').toDate(),
            bookingPersistService.participantLastName,
            bookingPersistService.noJugdeInHearings
        );
    });

    it('should onSearch (admin_search flag on) with no judge option selected', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue(true);
        component.enableSearchFeature = true;
        component.searchForm.controls['endDate'].setValue(null);
        component.onSearch();
        expect(bookingPersistService.noJugdeInHearings).toBeTruthy();
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(
            undefined,
            component.limit,
            bookingPersistService.caseNumber,
            bookingPersistService.selectedVenueIds,
            bookingPersistService.selectedCaseTypes,
            moment(bookingPersistService.startDate).startOf('day').toDate(),
            moment(bookingPersistService.startDate).endOf('day').toDate(),
            bookingPersistService.participantLastName,
            bookingPersistService.noJugdeInHearings
        );
    });

    describe('noJudgeInHearing', () => {
        it('no judge option is ON', () => {
            const optionSelected = true;
            bookingPersistService.noJugdeInHearings = optionSelected;
            expect(component.noJugdeInHearings).toBeTruthy();
        });

        it('no judge option is OFF', () => {
            const optionSelected = false;
            bookingPersistService.noJugdeInHearings = optionSelected;
            expect(component.noJugdeInHearings).toBeFalsy();
        });
    });

    describe('startDateOnBlur', () => {
        let startDateControl: AbstractControl;
        let endDateControl: AbstractControl;
        let startDateElement: HTMLInputElement;

        beforeEach(() => {
            component.enableSearchFeature = true;
            component.openSearchPanel();
            fixture.detectChanges();
            startDateControl = component.searchForm.controls['startDate'];
            endDateControl = component.searchForm.controls['endDate'];
            startDateElement = fixture.debugElement.query(By.css('#startDate')).nativeElement;
        });

        it('should clear startDate if after endDate', () => {
            const startDate = moment().startOf('day').add(2, 'days').toDate();
            const endDate = moment().startOf('day').add(1, 'days').toDate();
            startDateControl.setValue(startDate);
            endDateControl.setValue(endDate);
            startDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(startDateControl.value).toBeNull();
        });

        it('should clear startDate if in past', () => {
            const startDate = moment().startOf('day').add(-1, 'days').toDate();
            startDateControl.setValue(startDate);
            startDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(startDateControl.value).toBeNull();
        });

        it('should handle nulls', () => {
            const startDate = null;
            startDateControl.setValue(startDate);
            startDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(startDateControl.value).toBeNull();
        });

        it('should not clear startDate if startDate is valid and endDate is null', () => {
            const startDate = moment().startOf('day').add(1, 'days').toDate();
            startDateControl.setValue(startDate);
            endDateControl.setValue(null);
            startDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(startDateControl.value).toEqual(startDate);
        });

        it('should not clear startDate if startDate and endDate are valid', () => {
            const startDate = moment().startOf('day').add(1, 'days').toDate();
            const endDate = moment().startOf('day').add(2, 'days').toDate();
            startDateControl.setValue(startDate);
            endDateControl.setValue(endDate);
            startDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(startDateControl.value).toEqual(startDate);
        });
    });

    describe('endDateOnBlur', () => {
        let startDateControl: AbstractControl;
        let endDateControl: AbstractControl;
        let endDateElement: HTMLInputElement;

        beforeEach(() => {
            component.enableSearchFeature = true;
            component.openSearchPanel();
            fixture.detectChanges();
            startDateControl = component.searchForm.controls['startDate'];
            endDateControl = component.searchForm.controls['endDate'];
            endDateElement = fixture.debugElement.query(By.css('#endDate')).nativeElement;
        });

        it('should clear endDate if before startDate', () => {
            const startDate = moment().startOf('day').add(2, 'days').toDate();
            const endDate = moment().startOf('day').add(1, 'days').toDate();
            startDateControl.setValue(startDate);
            endDateControl.setValue(endDate);
            endDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(endDateControl.value).toBeNull();
        });

        it('should clear endDate if in past', () => {
            const endDate = moment().startOf('day').add(-1, 'days').toDate();
            endDateControl.setValue(endDate);
            endDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(endDateControl.value).toBeNull();
        });

        it('should handle nulls', () => {
            const endDate = null;
            endDateControl.setValue(endDate);
            endDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(endDateControl.value).toBeNull();
        });

        it('should not clear endDate if endDate is valid and startDate is null', () => {
            const endDate = moment().startOf('day').add(2, 'days').toDate();
            startDateControl.setValue(null);
            endDateControl.setValue(endDate);
            endDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(endDateControl.value).toEqual(endDate);
        });

        it('should not clear endDate if startDate and endDate are valid', () => {
            const startDate = moment().startOf('day').add(1, 'days').toDate();
            const endDate = moment().startOf('day').add(2, 'days').toDate();
            startDateControl.setValue(startDate);
            endDateControl.setValue(endDate);
            endDateElement.dispatchEvent(new Event('blur'));
            fixture.detectChanges();
            expect(endDateControl.value).toEqual(endDate);
        });
    });

    it('should onClear', () => {
        const searchFormSpy = component.searchForm;
        spyOn(searchFormSpy, 'reset');
        spyOn(bookingPersistService, 'resetAll');
        component.onClear();
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingPersistService.caseNumber).toEqual('');
        expect(bookingPersistService.selectedVenueIds).toEqual([]);
        expect(bookingPersistService.selectedCaseTypes).toEqual([]);
        expect(bookingPersistService.startDate).toEqual(null);
        expect(bookingPersistService.endDate).toEqual(null);
        expect(bookingPersistService.noJugdeInHearings).toBeFalsy();
        expect(bookingPersistService.resetAll).toHaveBeenCalledTimes(1);
        expect(searchFormSpy.reset).toHaveBeenCalledTimes(1);
    });

    it('should display correct title upon inital load', () => {
        component.ngOnInit();
        expect(component.title).toEqual('Booking List');
    });

    it('should update title after search', () => {
        setFormValue();
        component.onSearch();
        expect(component.title).toEqual('Search results');
    });

    it('should reset title after search is cleared', () => {
        setFormValue();
        component.enableSearchFeature = true;
        component.onSearch();
        expect(component.title).toEqual('Search results');
        component.onClear();
        expect(component.title).toEqual('Booking List');
    });

    it('should disable search button if all fields are empty', () => {
        component.openSearchPanel();
        clearSearch();
        component.enableSearchFeature = true;
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if caseNumber field is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['caseNumber'].setValue('CASE_NUMBER');
        component.enableSearchFeature = true;
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if participant lastName field is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['participantLastName'].setValue('PARTICIPANT_LAST_NAME');
        component.enableSearchFeature = true;
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if selectedVenueIds field is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['selectedVenueIds'].setValue([1, 2]);
        component.enableSearchFeature = true;
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if selectedCaseTypes field is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['selectedVenueIds'].setValue(['Tribunal']);
        component.enableSearchFeature = true;
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if start date is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['startDate'].setValue(new Date(2022, 3, 25));
        component.enableSearchFeature = true;
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if end date is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['endDate'].setValue(new Date(2022, 3, 25));
        component.enableSearchFeature = true;
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should close search panel when close search button clicked', () => {
        component.openSearchPanel();
        component.enableSearchFeature = true;
        fixture.detectChanges();
        let searchPanel = document.getElementById('searchPanel') as HTMLDivElement;
        expect(searchPanel).not.toBeNull();
        component.closeSearchPanel();
        fixture.detectChanges();
        searchPanel = document.getElementById('searchPanel') as HTMLDivElement;
        expect(searchPanel).toBeNull();
        const openSearchPanelButton = document.getElementById('openSearchPanelButton') as HTMLDivElement;
        expect(openSearchPanelButton).not.toBeNull();
        expect(component.showSearch).toBe(false);
    });

    it('should not load venues when search feature is disabled', () => {
        referenceDataServiceSpy.getCourts.calls.reset();
        launchDarklyServiceSpy.flagChange.next({ admin_search: false });
        fixture.detectChanges();
        expect(referenceDataServiceSpy.getCourts).toHaveBeenCalledTimes(0);
    });

    it('should load venues when search feature is enabled', () => {
        referenceDataServiceSpy.getCourts.calls.reset();
        launchDarklyServiceSpy.flagChange.next({ admin_search: true });
        fixture.detectChanges();
        expect(referenceDataServiceSpy.getCourts).toHaveBeenCalledTimes(1);
    });

    it('should hide the search panel on initial load when search feature enabled', () => {
        launchDarklyServiceSpy.flagChange.next({ admin_search: true });
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.showSearch).toBe(false);
    });

    it('should hide the search panel on initial load when search feature disabled', () => {
        launchDarklyServiceSpy.flagChange.next({ admin_search: false });
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.showSearch).toBe(false);
    });

    it(
        'should add bookings list records on the next scroll and delete duplicated hearings',
        waitForAsync(() => {
            component.bookings = new ArrayBookingslistModelTestData().getTestData();
            component.ngOnInit();
            expect(component.endOfData).toBeFalsy();
            fixture.detectChanges();
            component.scrollHandler(null);
            expect(component.bookings.length).toBe(2);
            expect(component.recordsLoaded).toBeTruthy();
        })
    );

    it(
        'should add bookings list records on next scroll',
        waitForAsync(() => {
            component.ngOnInit();
            expect(component.endOfData).toBeFalsy();
            fixture.detectChanges();
            component.scrollHandler(null);

            component.scrollHandler(null);
            expect(component.bookings.length).toBe(2);
        })
    );
    it('should select row', () => {
        component.bookings = new ArrayBookingslistModelTestData().getTestData();
        component.rowSelected(1, 0);
        expect(component.selectedGroupIndex).toBe(1);
        expect(component.selectedItemIndex).toBe(0);
    });
    it('should not select row if index is out of range', () => {
        component.bookings = new ArrayBookingslistModelTestData().getTestData();
        component.selectedGroupIndex = -1;
        component.selectedItemIndex = -1;
        component.rowSelected(5, 6);
        expect(component.selectedGroupIndex).toBe(-1);
        expect(component.selectedItemIndex).toBe(-1);

        component.rowSelected(-1, -1);
        expect(component.selectedGroupIndex).toBe(-1);
        expect(component.selectedItemIndex).toBe(-1);
    });

    it('should set row to unselected', () => {
        component.bookings = new ArrayBookingslistModelTestData().getTestData();
        component.rowSelected(1, 0);
        expect(component.bookings[1].BookingsDetails[0].Selected).toBeTruthy();

        component.unselectRows(1, 0);
        expect(component.bookings[1].BookingsDetails[0].Selected).toBeFalsy();
    });
    it('should find the record position in the bookings list', () => {
        component.bookings = new ArrayBookingslistModelTestData().getTestData();
        const booking = new BookingsDetailsModel(
            '33',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason14',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );

        component.resetBookingIndex(booking);
        expect(component.selectedGroupIndex).toBe(0);
        expect(component.selectedItemIndex).toBe(2);
    });
    it('should set the selected group index and item index to -1 for record is not found in the list', () => {
        component.bookings = new ArrayBookingslistModelTestData().getTestData();
        const booking = new BookingsDetailsModel(
            '3',
            new Date('2019-12-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'Tax',
            'JudgeGreen',
            '33A',
            'Coronation Street',
            'John Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            false,
            true,
            'reason15',
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );

        component.resetBookingIndex(booking);
        expect(component.selectedGroupIndex).toBe(-1);
        expect(component.selectedItemIndex).toBe(-1);
    });
    it('should persist information after row selected', () => {
        component.openSearchPanel();
        component.bookings = new ArrayBookingslistModelTestData().getTestData();
        component.rowSelected(1, 0);
        expect(returnUrlService.popUrl()).toEqual(PageUrls.BookingsList);
        expect(bookingPersistService.showSearch).toBe(true);
    });
    it('should get booking details by Id from data store', fakeAsync(async () => {
        await component.getEditedBookingFromStorage();
        expect(videoHearingServiceSpy.getHearingById).toHaveBeenCalled();
        expect(videoHearingServiceSpy.mapHearingDetailsResponseToHearingModel).toHaveBeenCalled();
    }));
    it('should on destroy unsubscribe the subscriptions', () => {
        component.getList();
        component.ngOnDestroy();
        expect(component.$subcription.closed).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should load persisted information', () => {
            const showSearch = true;
            const startDate = new Date(2022, 3, 11);
            const endDate = new Date(2022, 3, 12);
            bookingPersistService.showSearch = showSearch;
            bookingPersistService.startDate = startDate;
            bookingPersistService.endDate = endDate;
            component.ngOnInit();
            expect(component.showSearch).toBe(showSearch);
            expect(component.searchForm.controls.startDate.value).toEqual('2022-04-11');
            expect(component.searchForm.controls.endDate.value).toEqual('2022-04-12');
        });
    });
});
