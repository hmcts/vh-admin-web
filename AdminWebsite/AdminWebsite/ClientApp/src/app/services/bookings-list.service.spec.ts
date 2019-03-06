import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { BookingsListService } from './bookings-list.service';
import { BHClient, BookingsResponse, BookingsByDateResponse, BookingsHearingResponse } from '../services/clients/api-client';
import { Observable } from 'rxjs';
import { BookingsListModel, BookingsDetailsModel } from '../common/model/bookings-list.model';

describe('bookings service', () => {
    let bhClientSpy: jasmine.SpyObj<BHClient>;
    let bookingsResponse: BookingsResponse;
    let service: BookingsListService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [BookingsListService, { provide: BHClient, useValue: bhClientSpy }]
        });
        bhClientSpy = jasmine.createSpyObj<BHClient>('BHClient', ['getBookingsList']);
        bookingsResponse = new ResponseTestData().getTestData();

        bhClientSpy.getBookingsList.and.returnValue(Observable.create(bookingsResponse));
        service = TestBed.get(BookingsListService);
    });

    afterEach(() => {
        sessionStorage.clear();
    });


    it('should be created', inject([BookingsListService], (service: BookingsListService) => {
        expect(service).toBeTruthy();
    }));

    it('should map response to model', () => {
        bookingsResponse = new ResponseTestData().getBookingResponse();
        let model = service.mapBookingsResponse(bookingsResponse);
        expect(model).toBeTruthy();
        expect(model.Hearings.length).toBe(1)
        expect(model.NextCursor).toBe("1233");
        expect(model.Hearings[0].BookingsDate.getDate()).toBe(22)

        expect(model.Hearings[0].BookingsDetails.length).toBe(2);
        expect(model.Hearings[0].BookingsDetails[0].CourtRoom).toBe("12A");
        expect(model.Hearings[0].BookingsDetails[0].Duration).toBe(45);
        expect(model.Hearings[0].BookingsDetails[0].CourtAddress).toBe("court address");
        expect(model.Hearings[0].BookingsDetails[0].HearingCaseName).toBe("A vs B");
        expect(model.Hearings[0].BookingsDetails[0].HearingCaseNumber).toBe("123A");
        expect(model.Hearings[0].BookingsDetails[0].HearingType).toBe("Tax");
    });

    it('should add bookings to collection', inject([BookingsListService], (service: BookingsListService) => {
        bookingsResponse = new ResponseTestData().getBookingResponse();
        let model = service.mapBookingsResponse(bookingsResponse);
        let bookings: Array<BookingsListModel> = [];
        let result = service.addBookings(model, bookings);
        expect(result.length).toBeGreaterThan(0);
    }));

    it('should not add duplicated bookings to collection', inject([BookingsListService], (service: BookingsListService) => {
        bookingsResponse = new ResponseTestData().getBookingResponse();
        let model = service.mapBookingsResponse(bookingsResponse);
        let bookings: Array<BookingsListModel> = new ResponseTestData().getBookingsTestData();
        let result = service.addBookings(model, bookings);
        expect(result.length).toBe(2);
    }));
});

export class ResponseTestData {

    getBookingsTestData(): Array<BookingsListModel> {
        let listModel: Array<BookingsListModel> = [];
        let model = new BookingsListModel(new Date('2019-10-22 13:58:40.3730067'))
        let lists: Array<BookingsDetailsModel> = [];
        let b1 = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        let b2 = new BookingsDetailsModel('12', new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        let b3 = new BookingsDetailsModel('33', new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));

        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
        let model1 = new BookingsListModel(new Date('2019-11-22 15:58:40.3730067'))
        let b11 = new BookingsDetailsModel('44', new Date('2019-11-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        let b21 = new BookingsDetailsModel('45', new Date('2019-11-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        let b31 = new BookingsDetailsModel('46', new Date('2019-11-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        lists.push(b11);
        lists.push(b21);
        lists.push(b31);
        model1.BookingsDetails = lists;
        listModel.push(model);
        listModel.push(model1);
        return listModel;
    }

    getBookingResponse(): BookingsResponse {
        let bookingsResponse = new BookingsResponse();
        bookingsResponse.next_cursor = "1233";
        let dataRes = this.getTestData();
        bookingsResponse.hearings = new Array<BookingsByDateResponse>();
        bookingsResponse.hearings.push(dataRes);

        return bookingsResponse;
    }
    getTestData(): BookingsByDateResponse {

        let bhr = new BookingsHearingResponse();
        bhr.hearing_id = 1;
        bhr.created_date = new Date('2019-10-22 13:58:40.3730067');
        bhr.hearing_date = new Date('2019-10-22 13:58:40.3730067');
        bhr.last_edit_date = new Date('2019-10-22 13:58:40.3730067');
        bhr.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
        bhr.court_address = "court address";
        bhr.court_room = "12A";
        bhr.hearing_name = "A vs B";
        bhr.hearing_number = "123A";
        bhr.hearing_type_name = "Tax";
        bhr.judge_name = "Judge";
        bhr.scheduled_duration = 45;
        bhr.created_by = "Roy";
        bhr.last_edit_by = "Sam";

        let bhr1 = new BookingsHearingResponse();
        bhr1.hearing_id = 2;
        bhr1.created_date = new Date('2019-10-22 13:58:40.3730067');
        bhr1.hearing_date = new Date('2019-10-22 13:58:40.3730067');
        bhr1.last_edit_date = new Date('2019-10-22 13:58:40.3730067');
        bhr1.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
        bhr1.court_address = "court address";
        bhr1.court_room = "12A";
        bhr1.hearing_name = "A vs B";
        bhr1.hearing_number = "123A";
        bhr1.hearing_type_name = "Tax";
        bhr1.judge_name = "Judge";
        bhr1.scheduled_duration = 45;
        bhr1.created_by = "Roy";
        bhr1.last_edit_by = "Sam";

        let byDate = new BookingsByDateResponse();
        byDate.scheduled_date = new Date('2019-10-22 13:58:40.3730067');
        byDate.hearings = new Array<BookingsHearingResponse>();
        byDate.hearings.push(bhr);
        byDate.hearings.push(bhr1);

        return byDate;
    }
}
