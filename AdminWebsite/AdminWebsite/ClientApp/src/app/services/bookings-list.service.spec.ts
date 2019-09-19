import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { BookingsListService } from './bookings-list.service';
import { BHClient, BookingsResponse, BookingsByDateResponse, BookingsHearingResponse } from './clients/api-client';
import { of } from 'rxjs';
import { BookingsListModel, BookingsDetailsModel } from '../common/model/bookings-list.model';
import { BookingsModel } from '../common/model/bookings.model';

export class ResponseTestData {

  static getEditingBookings(): Array<BookingsListModel> {
    const listModel: Array<BookingsListModel> = [];
    const model = new BookingsListModel(new Date('2019-12-22 13:58:40.3730067'));
    const lists: Array<BookingsDetailsModel> = [];
    const b1 = new BookingsDetailsModel('1', new Date('2019-12-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b2 = new BookingsDetailsModel('12', new Date('2019-12-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b3 = new BookingsDetailsModel('33', new Date('2019-12-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);

    lists.push(b1);
    lists.push(b2);
    lists.push(b3);
    model.BookingsDetails = lists;
    listModel.push(model);
    return listModel;
  }

  static getBookingsTestData(): Array<BookingsListModel> {
    const listModel: Array<BookingsListModel> = [];

    const model = new BookingsListModel(new Date('2019-10-22 13:58:40.3730067'));
    const lists: Array<BookingsDetailsModel> = [];
    const b1 = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b2 = new BookingsDetailsModel('12', new Date('2019-10-22 14:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b3 = new BookingsDetailsModel('33', new Date('2019-10-22 14:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);

    lists.push(b1);
    lists.push(b2);
    lists.push(b3);
    model.BookingsDetails = lists;

    const lists1: Array<BookingsDetailsModel> = [];
    const model1 = new BookingsListModel(new Date('2019-11-22 15:58:40.3730067'));
    const b11 = new BookingsDetailsModel('44', new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b21 = new BookingsDetailsModel('45', new Date('2019-11-22 14:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b31 = new BookingsDetailsModel('46', new Date('2019-11-22 15:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
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

    const bhr = new BookingsHearingResponse();
    bhr.hearing_id = '1';
    bhr.created_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.hearing_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.last_edit_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
    bhr.court_address = 'court address';
    bhr.court_room = '12A';
    bhr.hearing_name = 'A vs B';
    bhr.hearing_number = '123A';
    bhr.hearing_type_name = 'Tax';
    bhr.judge_name = 'Judge';
    bhr.scheduled_duration = 45;
    bhr.created_by = 'Roy';
    bhr.last_edit_by = 'Sam';

    const bhr1 = new BookingsHearingResponse();
    bhr1.hearing_id = '2';
    bhr1.created_date = new Date('2019-10-22 13:58:40.3730067');
    bhr1.hearing_date = new Date('2019-10-22 13:58:40.3730067');
    bhr1.last_edit_date = new Date('2019-10-22 13:58:40.3730067');
    bhr1.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
    bhr1.court_address = 'court address';
    bhr1.court_room = '12A';
    bhr1.hearing_name = 'A vs B';
    bhr1.hearing_number = '123A';
    bhr1.hearing_type_name = 'Tax';
    bhr1.judge_name = 'Judge';
    bhr1.scheduled_duration = 45;
    bhr1.created_by = 'Roy';
    bhr1.last_edit_by = 'Sam';

    const byDate = new BookingsByDateResponse();
    byDate.scheduled_date = new Date('2019-10-22 13:58:40.3730067');
    byDate.hearings = new Array<BookingsHearingResponse>();
    byDate.hearings.push(bhr);
    byDate.hearings.push(bhr1);

    return byDate;
  }
}

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

    bhClientSpy.getBookingsList.and.returnValue(of(bookingsResponse));
    service = TestBed.get(BookingsListService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map response to model', () => {
    bookingsResponse = new ResponseTestData().getBookingResponse();
    const model = service.mapBookingsResponse(bookingsResponse);
    expect(model).toBeTruthy();
    expect(model.Hearings.length).toBe(1);
    expect(model.NextCursor).toBe('1233');
    expect(model.Hearings[0].BookingsDate.getDate()).toBe(22);

    expect(model.Hearings[0].BookingsDetails.length).toBe(2);
    expect(model.Hearings[0].BookingsDetails[0].CourtRoom).toBe('12A');
    expect(model.Hearings[0].BookingsDetails[0].Duration).toBe(45);
    expect(model.Hearings[0].BookingsDetails[0].CourtAddress).toBe('court address');
    expect(model.Hearings[0].BookingsDetails[0].HearingCaseName).toBe('A vs B');
    expect(model.Hearings[0].BookingsDetails[0].HearingCaseNumber).toBe('123A');
    expect(model.Hearings[0].BookingsDetails[0].HearingType).toBe('Tax');
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
  let bhClientSpy: jasmine.SpyObj<BHClient>;
  bhClientSpy = jasmine.createSpyObj<BHClient>('BHClient', ['getBookingsList']);
  const bookingsResponse = new ResponseTestData().getTestData();

  bhClientSpy.getBookingsList.and.returnValue(of(bookingsResponse));
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
});
