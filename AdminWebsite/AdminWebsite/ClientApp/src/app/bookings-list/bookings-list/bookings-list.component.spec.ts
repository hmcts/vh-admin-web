import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Output, EventEmitter, Directive, Component } from '@angular/core';
import { BookingsListComponent } from './bookings-list.component';
import { of, throwError } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { BookingsModel } from '../../common/model/bookings.model';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingsListModel, BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { BookingsResponse, BookingsByDateResponse, BookingsHearingResponse } from '../../services/clients/api-client';
import { Router } from '@angular/router';
import { BookingPersistService } from '../../services/bookings-persist.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { HearingModel } from '../../common/model/hearing.model';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { MomentModule } from 'ngx-moment';
import { HearingDetailsResponse } from '../../services/clients/api-client';

let component: BookingsListComponent;
let fixture: ComponentFixture<BookingsListComponent>;
let bookingsListServiceSpy: jasmine.SpyObj<BookingsListService>;
bookingsListServiceSpy = jasmine.createSpyObj<BookingsListService>('BookingsListService',
  ['getBookingsList', 'mapBookingsResponse', 'addBookings', 'replaceBookingRecord']);
let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;
videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingService',
  ['getCurrentRequest', 'cancelRequest', 'getHearingById', 'mapHearingDetailsResponseToHearingModel']);

export class ResponseTestData {
  getTestData(): BookingsResponse {
    const response = new BookingsResponse();
    const byDate = new BookingsByDateResponse();
    byDate.scheduled_date = new Date('2019-10-22 13:58:40.3730067');
    byDate.hearings = new Array<BookingsHearingResponse>();

    const bhr = new BookingsHearingResponse();
    bhr.hearing_id = '1';
    bhr.created_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.hearing_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.last_edit_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');

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
    const b1 = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b2 = new BookingsDetailsModel('2', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b3 = new BookingsDetailsModel('3', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
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
    const b1 = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b2 = new BookingsDetailsModel('2', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b3 = new BookingsDetailsModel('6', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
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
    const b1 = new BookingsDetailsModel('11', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b2 = new BookingsDetailsModel('12', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b3 = new BookingsDetailsModel('33', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    lists.push(b1);
    lists.push(b2);
    lists.push(b3);
    model.BookingsDetails = lists;
    const lists1: Array<BookingsDetailsModel> = [];
    const date1 = new Date('2019-11-22 00:00:00.0000000');
    const dateNoTime1 = new Date(date1.setHours(0, 0, 0, 0));
    const model1 = new BookingsListModel(dateNoTime1);
    const b11 = new BookingsDetailsModel('44', new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b21 = new BookingsDetailsModel('45', new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    const b31 = new BookingsDetailsModel('46', new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
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
class BookingDetailsComponent {
}

export class BookingPersistServiceSpy {
  private _bookingList: Array<BookingsListModel> = [];
  private _nextCuror = '12345';
  private _selectedGroupIndex = 0;
  private _selectedItemIndex = 0;

  get bookingList() {
    const listItem = new BookingslistTestData().getTestData();
    this._bookingList = [];
    this._bookingList.push(listItem);
    return this._bookingList;
  }

  set bookingList(value) {
    this._bookingList = value;
  }

  get nextCursor() { return this._nextCuror; }
  set nextCursor(value) { this._nextCuror = value; }
  get selectedGroupIndex() { return this._selectedGroupIndex; }
  get selectedItemIndex() { return this._selectedItemIndex; }
  set selectedGroupIndex(value) { this._selectedGroupIndex = value; }
  set selectedItemIndex(value) { this._selectedItemIndex = value; }
  updateBooking(hearing: HearingModel) {
    const booking = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'),
      'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);
    booking.IsStartTimeChanged = true;
    return booking;
  }
  resetAll() { }
}

let routerSpy: jasmine.SpyObj<Router>;


describe('BookingsListComponent', () => {
  beforeEach(async(() => {
    const data = new ResponseTestData().getTestData();

    bookingsListServiceSpy.getBookingsList.and.returnValue(of(data));
    const model1 = new BookingslistTestData().getBookings();
    const model2 = new BookingslistTestData().getBookings1();
    const listModel = new ArrayBookingslistModelTestData().getTestData();
    bookingsListServiceSpy.mapBookingsResponse.and.returnValues(model1, model1, model1, model2);
    bookingsListServiceSpy.addBookings.and.returnValue(listModel);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    videoHearingServiceSpy.getHearingById.and.returnValue(of(new HearingDetailsResponse()));
    TestBed.configureTestingModule({
      declarations: [BookingsListComponent, ScrollableDirective, BookingDetailsComponent, LongDatetimePipe],
      imports: [HttpClientModule, MomentModule],
      providers: [
        { provide: BookingsListService, useValue: bookingsListServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: VideoHearingsService, useValue: videoHearingServiceSpy },
        { provide: BookingPersistService, useClass: BookingPersistServiceSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookingsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

  }));

  it('should create bookings list component', (() => {
    expect(component).toBeTruthy();
  }));

  it('should show bookings list records', (() => {
    component.ngOnInit();
    expect(component.endOfData).toBeFalsy();
    expect(component.error).toBeFalsy();
    expect(component.recordsLoaded).toBeTruthy();
    expect(component.bookings.length).toBe(1);
    expect(component.loaded).toBeTruthy();
  }));

  it('should add bookings list records on the next scroll and delete duplicated hearings', async(() => {
    component.bookings = new ArrayBookingslistModelTestData().getTestData();
    component.ngOnInit();
    expect(component.endOfData).toBeFalsy();
    fixture.detectChanges();
    component.scrollHandler(null);
    expect(component.bookings.length).toBe(2);
    expect(component.recordsLoaded).toBeTruthy();
  }));

  it('should add bookings list records on next scroll', async(() => {
    component.ngOnInit();
    expect(component.endOfData).toBeFalsy();
    fixture.detectChanges();
    component.scrollHandler(null);

    component.scrollHandler(null);
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
    const booking = new BookingsDetailsModel('33', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);

    component.resetBookingIndex(booking);
    expect(component.selectedGroupIndex).toBe(0);
    expect(component.selectedItemIndex).toBe(2);
  });
  it('should set the selected group index and item index to -1 for record is not found in the list', () => {
    component.bookings = new ArrayBookingslistModelTestData().getTestData();
    const booking = new BookingsDetailsModel('3', new Date('2019-12-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JudgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'), 'Booked', false);

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

