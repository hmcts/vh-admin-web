import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Component, Directive, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { AbstractControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import moment from 'moment';
import { MomentModule } from 'ngx-moment';
import { of } from 'rxjs';
import { ConfigService } from 'src/app/services/config.service';
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { Logger } from 'src/app/services/logger';
import { ReferenceDataService } from 'src/app/services/reference-data.service';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { BookingsListModel } from '../../common/model/bookings-list.model';
import { BookingsModel } from '../../common/model/bookings.model';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingPersistService } from '../../services/bookings-persist.service';
import {
    BookingsByDateResponse,
    BookingsHearingResponse,
    BookingsResponse,
    CaseTypeResponse,
    HearingDetailsResponse,
    HearingVenueResponse,
    JusticeUserResponse
} from '../../services/clients/api-client';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingsListComponent } from './bookings-list.component';
import { DatePipe } from '@angular/common';
import { v4 as uuid } from 'uuid';
import { JusticeUsersMenuComponent } from '../../shared/menus/justice-users-menu/justice-users-menu.component';
import { CaseTypesMenuComponent } from '../../shared/menus/case-types-menu/case-types-menu.component';
import { VenuesMenuComponent } from '../../shared/menus/venues-menu/venues-menu.component';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { JusticeUserMenuStubComponent } from 'src/app/testing/stubs/dropdown-menu/justice-user-menu-stub.component';
import { BookingStatusComponent } from '../booking-status/booking-status.component';
import { BookingsListItemModel } from 'src/app/common/model/booking-list-item.model';
import { VHBooking } from 'src/app/common/model/vh-booking';

let component: BookingsListComponent;
let bookingPersistService: BookingPersistService;
let fixture: ComponentFixture<BookingsListComponent>;
const bookingsListServiceSpy = jasmine.createSpyObj<BookingsListService>('BookingsListService', [
    'getBookingsList',
    'mapBookingsResponse',
    'addBookings',
    'replaceBookingRecord'
]);
const videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingService', [
    'getCurrentRequest',
    'cancelRequest',
    'getHearingById',
    'mapHearingDetailsResponseToHearingModel',
    'getUsers'
]);
const referenceDataServiceSpy = jasmine.createSpyObj<ReferenceDataService>('ReferenceDataService', ['getCourts', 'getCaseTypes']);
const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
let returnUrlService: ReturnUrlService;
const featureFlagServiceSpy = jasmine.createSpyObj('FeatureFlagService', ['getFeatureFlagByName']);

export class ResponseTestData {
    getUserData(): Array<JusticeUserResponse> {
        const list: Array<JusticeUserResponse> = [];
        let user = new JusticeUserResponse();
        user.id = uuid();
        user.username = 'username1@mail.com';
        user.contact_email = 'username1@mail.com';
        user.first_name = 'firstName1';
        user.lastname = 'lastName1';
        list.push(user);

        user = new JusticeUserResponse();
        user.id = uuid();
        user.username = 'username2@mail.com';
        user.contact_email = 'username2@mail.com';
        user.first_name = 'firstName2';
        user.lastname = 'lastName2';
        list.push(user);

        return list;
    }

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
        const lists: Array<BookingsListItemModel> = [];
        const b1 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '1',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b1.Booking.allocatedTo = 'allocated-to';

        const b2 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '2',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',
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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b2.Booking.allocatedTo = 'allocated-to';

        const b3 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '3',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b3.Booking.allocatedTo = 'allocated-to';

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
        const lists: Array<BookingsListItemModel> = [];
        const b1 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '1',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b1.Booking.allocatedTo = 'allocated-to';

        const b2 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '2',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b2.Booking.allocatedTo = 'allocated-to';

        const b3 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '6',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b3.Booking.allocatedTo = 'allocated-to';

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
        const lists: Array<BookingsListItemModel> = [];
        const b1 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '11',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b1.Booking.allocatedTo = 'allocated-to';

        const b2 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '12',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b2.Booking.allocatedTo = 'allocated-to';

        const b3 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '33',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b3.Booking.allocatedTo = 'allocated-to';

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        model.BookingsDetails = lists;
        const lists1: Array<BookingsListItemModel> = [];
        const date1 = new Date('2019-11-22 00:00:00.0000000');
        const dateNoTime1 = new Date(date1.setHours(0, 0, 0, 0));
        const model1 = new BookingsListModel(dateNoTime1);
        const b11 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '44',
                new Date('2019-11-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b11.Booking.allocatedTo = 'allocated-to';

        const b21 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '45',
                new Date('2019-11-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b21.Booking.allocatedTo = 'allocated-to';

        const b31 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '46',
                new Date('2019-11-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        b31.Booking.allocatedTo = 'allocated-to';

        lists1.push(b11);
        lists1.push(b21);
        lists1.push(b31);
        model1.BookingsDetails = lists1;

        listModel.push(model);
        listModel.push(model1);
        return listModel;
    }
}

@Directive({
    selector: '[appScrollable]',
    standalone: false
})
class ScrollableDirective {
    @Output() scrollPosition = new EventEmitter();
}

@Component({
    selector: 'app-booking-details',
    template: '',
    standalone: false
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
    private _selectedUsers: string[] = [];

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

    get selectedUsers(): string[] {
        return this._selectedUsers;
    }

    set selectedUsers(value) {
        this._selectedUsers = value;
    }

    updateBooking() {
        const booking = new BookingsListItemModel(
            VHBooking.createForDetails(
                '1',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );
        booking.IsStartTimeChanged = true;
        booking.Booking.groupId = '123';
        booking.Booking.hearingsInGroup = [booking.Booking, booking.Booking];
        return booking;
    }
    resetAll() {}
}

let routerSpy: jasmine.SpyObj<Router>;
const configServiceSpy = jasmine.createSpyObj('ConfigService', ['getConfig']);
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn', 'info']);
const justiceUserServiceSpy = jasmine.createSpyObj<JusticeUsersService>('JusticeUsersService', ['allUsers$']);

describe('BookingsListComponent', () => {
    beforeEach(waitForAsync(() => {
        const data = new ResponseTestData().getTestData();

        bookingsListServiceSpy.getBookingsList.and.returnValue(of(data));
        const model1 = new BookingslistTestData().getBookings();
        const model2 = new BookingslistTestData().getBookings1();
        const listModel = new ArrayBookingslistModelTestData().getTestData();
        bookingsListServiceSpy.mapBookingsResponse.and.returnValues(model1, model1, model1, model2);
        bookingsListServiceSpy.addBookings.and.returnValue(listModel);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        videoHearingServiceSpy.getHearingById.and.returnValue(of(new HearingDetailsResponse()));
        referenceDataServiceSpy.getCaseTypes.and.returnValue(of(new Array<CaseTypeResponse>()));
        configServiceSpy.getConfig.and.returnValue({});

        referenceDataServiceSpy.getCourts.and.returnValue(of(new Array<HearingVenueResponse>()));
        featureFlagServiceSpy.getFeatureFlagByName.and.returnValue(of(false));

        TestBed.configureTestingModule({
            declarations: [
                BookingsListComponent,
                ScrollableDirective,
                BookingDetailsComponent,
                LongDatetimePipe,
                JusticeUserMenuStubComponent,
                CaseTypesMenuComponent,
                VenuesMenuComponent,
                BookingStatusComponent
            ],
            imports: [MomentModule, ReactiveFormsModule, NgSelectModule],
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
                { provide: JusticeUsersService, useValue: justiceUserServiceSpy },
                { provide: JusticeUsersMenuComponent, useClass: JusticeUserMenuStubComponent },
                DatePipe,
                provideHttpClient(withInterceptorsFromDi())
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BookingsListComponent);
        component = fixture.componentInstance;
        bookingPersistService = TestBed.inject(BookingPersistService);
        returnUrlService = TestBed.inject(ReturnUrlService);
        component.csoMenu = TestBed.inject(JusticeUsersMenuComponent);
        fixture.detectChanges();
    }));

    function setFormValue(noJudge?: boolean) {
        component.searchForm.controls['caseNumber'].setValue('CASE_NUMBER');
        component.searchForm.controls['startDate'].setValue(moment().startOf('day').add(1, 'days').toDate());
        component.searchForm.controls['endDate'].setValue(moment().startOf('day').add(2, 'days').toDate());
        component.searchForm.controls['participantLastName'].setValue('PARTICIPANT_LAST_NAME');
        component.searchForm.controls['noJudge'].setValue(noJudge ?? false);
    }

    function clearSearch() {
        component.searchForm.controls['caseNumber'].setValue('');
        component.searchForm.controls['startDate'].setValue(null);
        component.searchForm.controls['endDate'].setValue(null);
        component.searchForm.controls['participantLastName'].setValue('');
        component.searchForm.controls['noJudge'].setValue(false);
        component.searchForm.controls['noAllocated'].setValue(false);
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

    it('should onSearch', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue();
        component.onSearch();
        expect(bookingPersistService.caseNumber).toMatch('CASE_NUMBER');
        expect(bookingPersistService.participantLastName).toMatch('PARTICIPANT_LAST_NAME');
        expect(bookingPersistService.startDate).toEqual(moment().startOf('day').add(1, 'days').toDate());
        expect(bookingPersistService.endDate).toEqual(moment().startOf('day').add(2, 'days').toDate());
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(
            undefined,
            component.limit,
            bookingPersistService.caseNumber,
            bookingPersistService.selectedVenueIds,
            bookingPersistService.selectedCaseTypes,
            bookingPersistService.selectedUsers,
            moment(bookingPersistService.startDate).startOf('day').toDate(),
            moment(bookingPersistService.endDate).endOf('day').toDate(),
            bookingPersistService.participantLastName,
            bookingPersistService.noJugdeInHearings,
            bookingPersistService.noAllocatedHearings
        );
    });

    it('should onSearch (admin_search flag on) with populated endDate and empty startDate', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue();
        component.searchForm.controls['startDate'].setValue(null);
        component.onSearch();
        expect(bookingPersistService.caseNumber).toMatch('CASE_NUMBER');
        expect(bookingPersistService.participantLastName).toMatch('PARTICIPANT_LAST_NAME');
        expect(bookingPersistService.startDate).toBeNull();
        expect(bookingPersistService.endDate).toEqual(moment().startOf('day').add(2, 'days').toDate());
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(
            undefined,
            component.limit,
            bookingPersistService.caseNumber,
            bookingPersistService.selectedVenueIds,
            bookingPersistService.selectedCaseTypes,
            bookingPersistService.selectedUsers,
            moment(bookingPersistService.endDate).startOf('day').toDate(),
            moment(bookingPersistService.endDate).endOf('day').toDate(),
            bookingPersistService.participantLastName,
            bookingPersistService.noJugdeInHearings,
            bookingPersistService.noAllocatedHearings
        );
    });

    it('should onSearch (admin_search flag on) with populated startDate and empty endDate', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue();
        component.searchForm.controls['endDate'].setValue(null);
        component.onSearch();
        expect(bookingPersistService.caseNumber).toMatch('CASE_NUMBER');
        expect(bookingPersistService.participantLastName).toMatch('PARTICIPANT_LAST_NAME');
        expect(bookingPersistService.startDate).toEqual(moment().startOf('day').add(1, 'days').toDate());
        expect(bookingPersistService.endDate).toBeNull();
        expect(component.bookings.length).toBeGreaterThan(0);
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(
            undefined,
            component.limit,
            bookingPersistService.caseNumber,
            bookingPersistService.selectedVenueIds,
            bookingPersistService.selectedCaseTypes,
            bookingPersistService.selectedUsers,
            moment(bookingPersistService.startDate).startOf('day').toDate(),
            moment(bookingPersistService.startDate).endOf('day').toDate(),
            bookingPersistService.participantLastName,
            bookingPersistService.noJugdeInHearings,
            bookingPersistService.noAllocatedHearings
        );
    });

    it('should onSearch (admin_search flag on) with no judge option selected', () => {
        bookingsListServiceSpy.getBookingsList.calls.reset();
        setFormValue(true);
        component.searchForm.controls['endDate'].setValue(null);
        component.onSearch();
        expect(bookingPersistService.noJugdeInHearings).toBeTruthy();
        expect(bookingsListServiceSpy.getBookingsList).toHaveBeenCalledWith(
            undefined,
            component.limit,
            bookingPersistService.caseNumber,
            bookingPersistService.selectedVenueIds,
            bookingPersistService.selectedCaseTypes,
            bookingPersistService.selectedUsers,
            moment(bookingPersistService.startDate).startOf('day').toDate(),
            moment(bookingPersistService.startDate).endOf('day').toDate(),
            bookingPersistService.participantLastName,
            bookingPersistService.noJugdeInHearings,
            bookingPersistService.noAllocatedHearings
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
        const csoMenu = onClearTest();
        expect(csoMenu).toHaveBeenCalledTimes(1);
    });

    function onClearTest() {
        const formBuilder = new FormBuilder();
        const bookingPersistServiceSpy = jasmine.createSpyObj('BookingPersistService', [
            'selectedUsers',
            'selectedCaseTypes',
            'selectedVenueIds'
        ]);

        component.csoMenu = new JusticeUsersMenuComponent(bookingPersistServiceSpy, justiceUserServiceSpy, formBuilder, loggerSpy);
        component.caseTypeMenu = new CaseTypesMenuComponent(bookingPersistServiceSpy, videoHearingServiceSpy, formBuilder, loggerSpy);
        component.venueMenu = new VenuesMenuComponent(bookingPersistServiceSpy, referenceDataServiceSpy, formBuilder, loggerSpy);

        const searchFormSpy = component.searchForm;
        spyOn(searchFormSpy, 'reset');
        spyOn(bookingPersistService, 'resetAll');
        const csoMenuSpy = spyOn(component.csoMenu, 'clear');

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
        return csoMenuSpy;
    }
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
        const formBuilder = new FormBuilder();
        const bookingPersistServiceSpy = jasmine.createSpyObj('BookingPersistService', [
            'selectedUsers',
            'selectedCaseTypes',
            'selectedVenueIds'
        ]);
        component.csoMenu = new JusticeUsersMenuComponent(bookingPersistServiceSpy, justiceUserServiceSpy, formBuilder, loggerSpy);
        component.caseTypeMenu = new CaseTypesMenuComponent(bookingPersistServiceSpy, videoHearingServiceSpy, formBuilder, loggerSpy);
        component.venueMenu = new VenuesMenuComponent(bookingPersistServiceSpy, referenceDataServiceSpy, formBuilder, loggerSpy);

        setFormValue();
        component.onSearch();
        expect(component.title).toEqual('Search results');
        component.onClear();
        expect(component.title).toEqual('Booking List');
    });

    it('should disable search button if all fields are empty', () => {
        component.openSearchPanel();
        clearSearch();
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if caseNumber field is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['caseNumber'].setValue('CASE_NUMBER');
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if participant lastName field is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['participantLastName'].setValue('PARTICIPANT_LAST_NAME');
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if start date is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['startDate'].setValue(new Date(2022, 3, 25));
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should enable search button if end date is valid', () => {
        component.openSearchPanel();
        clearSearch();
        component.searchForm.controls['endDate'].setValue(new Date(2022, 3, 25));
        fixture.detectChanges();
        const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
        expect(searchButton.disabled).toBe(false);
    });

    it('should close search panel when close search button clicked', () => {
        component.openSearchPanel();
        fixture.detectChanges();
        let searchPanel = document.getElementById('searchPanel') as HTMLDivElement;
        expect(searchPanel).not.toBeNull();

        const formBuilder = new FormBuilder();
        const bookingPersistServiceSpy = jasmine.createSpyObj('BookingPersistService', [
            'selectedUsers',
            'selectedCaseTypes',
            'selectedVenueIds'
        ]);
        component.csoMenu = new JusticeUsersMenuComponent(bookingPersistServiceSpy, justiceUserServiceSpy, formBuilder, loggerSpy);
        component.caseTypeMenu = new CaseTypesMenuComponent(bookingPersistServiceSpy, videoHearingServiceSpy, formBuilder, loggerSpy);
        component.venueMenu = new VenuesMenuComponent(bookingPersistServiceSpy, referenceDataServiceSpy, formBuilder, loggerSpy);

        component.closeSearchPanel();
        fixture.detectChanges();
        searchPanel = document.getElementById('searchPanel') as HTMLDivElement;
        expect(searchPanel).toBeNull();
        const openSearchPanelButton = document.getElementById('openSearchPanelButton') as HTMLDivElement;
        expect(openSearchPanelButton).not.toBeNull();
        expect(component.showSearch).toBe(false);
    });

    it('should hide the search panel on initial load', () => {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.showSearch).toBe(false);
    });

    it('should add bookings list records on the next scroll and delete duplicated hearings', waitForAsync(() => {
        component.bookings = new ArrayBookingslistModelTestData().getTestData();
        component.ngOnInit();
        expect(component.endOfData).toBeFalsy();
        fixture.detectChanges();
        component.scrollHandler();
        expect(component.bookings.length).toBe(2);
        expect(component.recordsLoaded).toBeTruthy();
    }));

    it('should add bookings list records on next scroll', waitForAsync(() => {
        component.ngOnInit();
        expect(component.endOfData).toBeFalsy();
        fixture.detectChanges();
        component.scrollHandler();

        component.scrollHandler();
        expect(component.bookings.length).toBe(2);
    }));
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
        const booking = new BookingsListItemModel(
            VHBooking.createForDetails(
                '33',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
        );

        component.resetBookingIndex(booking);
        expect(component.selectedGroupIndex).toBe(0);
        expect(component.selectedItemIndex).toBe(2);
    });
    it('should set the selected group index and item index to -1 for record is not found in the list', () => {
        component.bookings = new ArrayBookingslistModelTestData().getTestData();
        const booking = new BookingsListItemModel(
            VHBooking.createForDetails(
                '3',
                new Date('2019-12-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

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
                true,
                'Financial Remedy',
                'judge.green@hmcts.net',
                '1234567'
            )
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

    describe('onSearch', () => {
        it('should clear previously selected row', () => {
            component.bookings = new ArrayBookingslistModelTestData().getTestData();
            const rowIndex = component.bookings.length - 1;
            component.rowSelected(0, rowIndex);
            component.onSearch();
            expect(component.selectedHearingId).toBe('');
            expect(component.selectedGroupIndex).toBe(-1);
            expect(component.selectedItemIndex).toBe(-1);
        });
    });

    describe('onSelectUserChange', () => {
        it('should disable noAllocated if any selected user', () => {
            bookingPersistService.selectedUsers = new ResponseTestData().getUserData().map(x => x.id);
            component.searchForm.controls['selectedUserIds'].setValue([
                bookingPersistService.selectedUsers[0],
                bookingPersistService.selectedUsers[1]
            ]);
            component.onSelectUserChange();
            expect(component.searchForm.controls['noAllocated'].disabled).toBeTruthy();
        });

        it('should enable noAllocated if no selected user', () => {
            bookingPersistService.selectedUsers = [];
            component.onSelectUserChange();
            expect(component.searchForm.controls['noAllocated'].disabled).toBeFalsy();
        });
    });

    describe('onChangeNoAllocated', () => {
        const bookingList = new BookingslistTestData();
        const bookingData = bookingList.getTestData();
        beforeEach(() => {
            const formBuilder = new FormBuilder();
            const bookingPersistServiceSpy = jasmine.createSpyObj('BookingPersistService', ['selectedCaseTypes']);
            component.csoMenu = new JusticeUsersMenuComponent(bookingPersistServiceSpy, justiceUserServiceSpy, formBuilder, loggerSpy);
            spyOn(component.csoMenu, 'enabled');
        });
        it('should disable selectedUsers if noAllocated is checked', () => {
            bookingPersistService.selectedUsers = new ResponseTestData().getUserData().map(x => x.id);
            component.searchForm.controls['noAllocated'].setValue(true);
            component.onChangeNoAllocated();
            expect(bookingPersistService.selectedUsers).toEqual([]);
        });

        it('should enable selectedUsers if noAllocated is not checked', () => {
            bookingPersistService.selectedUsers = new ResponseTestData().getUserData().map(x => x.id);
            const count = bookingPersistService.selectedUsers.length;
            component.searchForm.controls['noAllocated'].setValue(false);
            component.onChangeNoAllocated();
            expect(bookingPersistService.selectedUsers.length).toEqual(count);
        });

        it('should show allocated label to', () => {
            component.ngOnInit();
            fixture.detectChanges();
            const divToHide = fixture.debugElement.query(By.css('#allocated-to-' + bookingData.BookingsDetails[0].Booking.hearingId));
            expect(divToHide).toBeTruthy();
        });
    });
});
