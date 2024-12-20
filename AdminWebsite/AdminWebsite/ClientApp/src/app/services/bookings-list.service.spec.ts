import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { BookingsListService } from './bookings-list.service';
import { BHClient, BookingsResponse, BookingsByDateResponse, BookingsHearingResponse } from './clients/api-client';
import { Observable, of } from 'rxjs';
import { BookingsListModel } from '../common/model/bookings-list.model';
import { BookingsModel } from '../common/model/bookings.model';
import { BookingsListItemModel } from '../common/model/booking-list-item.model';
import { VHBooking } from '../common/model/vh-booking';

export class ResponseTestData {
    static getEditingBookings(): Array<BookingsListModel> {
        const listModel: Array<BookingsListModel> = [];
        const model = new BookingsListModel(new Date('2019-12-22 00:00:00.0000000'));
        const lists: Array<BookingsListItemModel> = [];
        const b1 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '1',
                new Date('2019-12-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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
        const b2 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '12',
                new Date('2019-12-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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
        const b3 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '33',
                new Date('2019-12-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        model.BookingsDetails = lists;
        listModel.push(model);
        return listModel;
    }

    static getBookingsTestData(): Array<BookingsListModel> {
        const listModel: Array<BookingsListModel> = [];

        const model = new BookingsListModel(new Date('2019-10-22 00:00:00.0000000'));
        const lists: Array<BookingsListItemModel> = [];
        const b1 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '1',
                new Date('2019-10-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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
        const b2 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '12',
                new Date('2019-10-22 14:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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
        const b3 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '33',
                new Date('2019-10-22 14:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        model.BookingsDetails = lists;

        const lists1: Array<BookingsListItemModel> = [];
        const model1 = new BookingsListModel(new Date('2019-11-22 00:00:00.0000000'));
        const b11 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '44',
                new Date('2019-11-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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
        const b21 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '45',
                new Date('2019-11-22 14:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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
        const b31 = new BookingsListItemModel(
            VHBooking.createForDetails(
                '46',
                new Date('2019-11-22 15:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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

        lists1.push(b11);
        lists1.push(b21);
        lists1.push(b31);
        model1.BookingsDetails = lists1;

        listModel.push(model);
        listModel.push(model1);
        return listModel;
    }

    getBookingResponse(): BookingsResponse {
        const bookingsResponse = new BookingsResponse();
        bookingsResponse.next_cursor = '1233';
        const dataRes = this.getTestData();
        bookingsResponse.hearings = new Array<BookingsByDateResponse>();
        bookingsResponse.hearings.push(dataRes);

        return bookingsResponse;
    }
    getTestData(): BookingsByDateResponse {
        const date = new Date('2019-10-22 13:58:40.3730067');
        const bhr = new BookingsHearingResponse({ hearing_date: date });
        bhr.hearing_id = '1';
        bhr.created_date = date;
        bhr.last_edit_date = date;
        bhr.scheduled_date_time = date;
        bhr.court_address = 'court address';
        bhr.court_room = '12A';
        bhr.hearing_name = 'A vs B';
        bhr.hearing_number = '123A';
        bhr.judge_name = 'Judge';
        bhr.scheduled_duration = 45;
        bhr.created_by = 'Roy';
        bhr.last_edit_by = 'Sam';
        bhr.audio_recording_required = true;
        bhr.cancel_reason = 'some more information';

        const bhr1 = new BookingsHearingResponse({ hearing_date: date });
        bhr1.hearing_id = '2';
        bhr1.created_date = date;
        bhr1.last_edit_date = date;
        bhr1.scheduled_date_time = date;
        bhr1.court_address = 'court address';
        bhr1.court_room = '12A';
        bhr1.hearing_name = 'A vs B';
        bhr1.hearing_number = '123A';
        bhr1.judge_name = 'Judge';
        bhr1.scheduled_duration = 45;
        bhr1.created_by = 'Roy';
        bhr1.last_edit_by = 'Sam';
        bhr1.audio_recording_required = true;
        bhr1.cancel_reason = 'some more information1';

        const byDate = new BookingsByDateResponse();
        byDate.scheduled_date = new Date('2019-10-22 00:00:00.0000000');
        byDate.hearings = new Array<BookingsHearingResponse>();
        byDate.hearings.push(bhr);
        byDate.hearings.push(bhr1);

        return byDate;
    }
}

describe('bookings list service', () => {
    let bhClientSpy: jasmine.SpyObj<BHClient>;
    let bookingsResponse: BookingsResponse;
    let service: BookingsListService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [BookingsListService, { provide: BHClient, useValue: bhClientSpy }]
        });
        bhClientSpy = jasmine.createSpyObj<BHClient>('BHClient', ['bookingsList']);
        bookingsResponse = new ResponseTestData().getTestData();

        bhClientSpy.bookingsList.and.returnValue(of(bookingsResponse));
        service = TestBed.inject(BookingsListService);
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should map response to model', () => {
        bookingsResponse = new ResponseTestData().getBookingResponse();
        bookingsResponse.hearings[0].hearings[0].group_id = '123';
        const model = service.mapBookingsResponse(bookingsResponse);
        expect(model).toBeTruthy();
        expect(model.Hearings.length).toBe(1);
        expect(model.NextCursor).toBe('1233');
        expect(model.Hearings[0].BookingsDate.getDate()).toBe(22);

        expect(model.Hearings[0].BookingsDetails.length).toBe(2);
        expect(model.Hearings[0].BookingsDetails[0].Booking.courtRoom).toBe('12A');
        expect(model.Hearings[0].BookingsDetails[0].Booking.scheduledDuration).toBe(45);
        expect(model.Hearings[0].BookingsDetails[0].Booking.courtName).toBe('court address');
        expect(model.Hearings[0].BookingsDetails[0].Booking.case.name).toBe('A vs B');
        expect(model.Hearings[0].BookingsDetails[0].Booking.case.number).toBe('123A');
        expect(model.Hearings[0].BookingsDetails[0].Booking.audioRecordingRequired).toBe(true);
        expect(model.Hearings[0].BookingsDetails[0].Booking.groupId).toBe('123');
    });

    it('should add bookings to collection', () => {
        bookingsResponse = new ResponseTestData().getBookingResponse();
        const model = service.mapBookingsResponse(bookingsResponse);
        const bookings: Array<BookingsListModel> = [];
        const result = service.addBookings(model, bookings);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should not add duplicated bookings to collection', () => {
        bookingsResponse = new ResponseTestData().getBookingResponse();
        const model = service.mapBookingsResponse(bookingsResponse);
        const bookings: Array<BookingsListModel> = ResponseTestData.getBookingsTestData();
        const result = service.addBookings(model, bookings);
        expect(result.length).toBe(2);
        expect(result[0].BookingsDetails.length).toBe(4);
        expect(result[1].BookingsDetails.length).toBe(3);
    });
});

describe('Booking list service functionality', () => {
    const bhClientSpy = jasmine.createSpyObj<BHClient>('BHClient', ['bookingsList']);
    const bookingsResponse = new ResponseTestData().getTestData();

    bhClientSpy.bookingsList.and.returnValue(of(bookingsResponse));
    const service = new BookingsListService(bhClientSpy);

    it('should append new date group with 1 record to list and remove duplicated record', () => {
        const model = new BookingsModel('234');
        model.Hearings = ResponseTestData.getEditingBookings();
        const bookings: Array<BookingsListModel> = ResponseTestData.getBookingsTestData();

        service.bookingsList = bookings;
        // initially we have two date groups with 3 and 3 records
        expect(service.bookingsList.length).toBe(2);
        expect(service.bookingsList[0].BookingsDetails.length).toBe(3);
        expect(service.bookingsList[1].BookingsDetails.length).toBe(3);

        // we change date  in 1st group, it should result in delete empty group and create new one
        const result = service.addBookings(model, bookings);
        expect(result.length).toBe(2);
        expect(result[0].BookingsDetails.length).toBe(3);
        expect(result[1].BookingsDetails.length).toBe(3);
    });
    it('should replace the edited record to the existing correct date group', () => {
        const bookingsList = ResponseTestData.getBookingsTestData();
        const bookingEdited = new BookingsListItemModel(
            VHBooking.createForDetails(
                '1',
                new Date('2019-11-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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
        bookingEdited.IsStartTimeChanged = true;

        expect(bookingsList.length).toBe(2);
        expect(bookingsList[0].BookingsDetails.length).toBe(3);
        expect(bookingsList[1].BookingsDetails.length).toBe(3);

        service.replaceBookingRecord(bookingEdited, bookingsList);

        expect(bookingsList.length).toBe(2);
        expect(bookingsList[0].BookingsDetails.length).toBe(2);
        expect(bookingsList[1].BookingsDetails.length).toBe(4);
    });
    it('should remove from date group record and add a new date group for the edited record', () => {
        const bookingsList = ResponseTestData.getBookingsTestData();
        const bookingEdited = new BookingsListItemModel(
            VHBooking.createForDetails(
                '1',
                new Date('2019-12-22 13:58:40.3730067'),
                120,
                'XX3456234565',
                'Smith vs Donner',

                'JadgeGreen',
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

        bookingEdited.IsStartTimeChanged = true;

        expect(bookingsList.length).toBe(2);
        expect(bookingsList[0].BookingsDetails.length).toBe(3);
        expect(bookingsList[1].BookingsDetails.length).toBe(3);

        service.replaceBookingRecord(bookingEdited, bookingsList);

        expect(bookingsList.length).toBe(3);
        expect(bookingsList[0].BookingsDetails.length).toBe(2);
        expect(bookingsList[1].BookingsDetails.length).toBe(3);
    });

    it('should return the bookings list for search criteria', () => {
        const limit = 100;
        const searchTerm = 'CASE_NUMBER';
        const selectedVenueIds = [1, 2];
        const selectedCaseTypes = ['Tribunal', 'Mental Health'];
        const selectedUsers = [];
        const startDate = new Date(2022, 3, 25);
        const endDate = new Date(2022, 3, 26);
        const bookings = service.getBookingsList(
            'cursor',
            limit,
            searchTerm,
            selectedVenueIds,
            selectedCaseTypes,
            selectedUsers,
            startDate,
            endDate
        );
        expect(bhClientSpy.bookingsList).toHaveBeenCalledTimes(1);
        expect(bookings).toEqual(jasmine.any(Observable));
    });
});
