import { HttpClientModule } from '@angular/common/http';
import { Component, Directive, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { MomentModule } from 'ngx-moment';
import { BehaviorSubject, of } from 'rxjs';
import { ConfigService } from 'src/app/services/config.service';
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { Logger } from 'src/app/services/logger';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
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
    HearingVenueResponse
} from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingsListComponent } from './bookings-list.component';

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
    'mapHearingDetailsResponseToHearingModel'
]);
let referenceDataServiceSpy: jasmine.SpyObj<ReferenceDataService>;
referenceDataServiceSpy = jasmine.createSpyObj('ReferenceDataService', ['getCourts', 'fetchPublicHolidays', 'getPublicHolidays']);
let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['flagChange']);

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
    private _searchTerm = 'SEARCH_VALUE';

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

    get searchTerm(): string {
        return this._searchTerm;
    }

    set searchTerm(value) {
        this._searchTerm = value;
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
            configServiceSpy.getConfig.and.returnValue({});
            launchDarklyServiceSpy.flagChange = new BehaviorSubject({ admin_search: true });
            referenceDataServiceSpy.getCourts.and.returnValue(of(new Array<HearingVenueResponse>()));

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
                    { provide: ReferenceDataService, useValue: referenceDataServiceSpy }
                ]
            }).compileComponents();

            fixture = TestBed.createComponent(BookingsListComponent);
            component = fixture.componentInstance;
            bookingPersistService = TestBed.inject(BookingPersistService);
            fixture.detectChanges();
        })
    );

    function setFormValue() {
        component.searchForm.controls['caseNumber'].setValue('CASE_NUMBER');
        component.searchForm.controls['selectedVenueIds'].setValue([1, 2]);
    }

    function clearSearch() {
        component.searchForm.controls['caseNumber'].setValue('');
        component.searchForm.controls['selectedVenueIds'].setValue([]);
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
        setFormValue();
        component.onSearch();
        expect(bookingPersistService.searchTerm).toMatch('CASE_NUMBER');
        expect(bookingPersistService.selectedVenueIds).toEqual([1, 2]);
        expect(component.bookings.length).toBeGreaterThan(0);
    });

    it('should onSearch (admin_search flag on)', () => {
        setFormValue();
        component.enableSearchFeature = false;
        component.onSearch();
        expect(bookingPersistService.searchTerm).toMatch('CASE_NUMBER');
        expect(bookingPersistService.selectedVenueIds).toEqual([1, 2]);
        expect(component.bookings.length).toBeGreaterThan(0);
    });

    it('should onClear', () => {
        const searchFormSpy = component.searchForm;
        spyOn(searchFormSpy, 'reset');
        spyOn(bookingPersistService, 'resetAll');
        component.onClear();
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingPersistService.searchTerm).toEqual('');
        expect(bookingPersistService.selectedVenueIds).toEqual([]);
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
        expect(searchButton.disabled).toBe(true);
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

    it('should enable search button if selectedVenueIds field is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['selectedVenueIds'].setValue([1, 2]);
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
});
