import { async, ComponentFixture, TestBed, fakeAsync, tick  } from '@angular/core/testing';
import { Output, EventEmitter, Directive, Component, Input } from '@angular/core';
import { BookingsListComponent } from './bookings-list.component';
import { of, throwError } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { BookingsModel } from '../../common/model/bookings.model';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingsListModel, BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { BookingsResponse, BookingsByDateResponse, BookingsHearingResponse } from '../../services/clients/api-client';

let component: BookingsListComponent;
let fixture: ComponentFixture<BookingsListComponent>;
let bookingsListServiceSpy: jasmine.SpyObj<BookingsListService>;
bookingsListServiceSpy = jasmine.createSpyObj<BookingsListService>('BookingsListService',
  ['getBookingsList', 'mapBookingsResponse', 'addBookings']);

export class ResponseTestData {

  getTestData(): BookingsResponse {
    const response = new BookingsResponse();
    const byDate = new BookingsByDateResponse();
    byDate.scheduled_date = new Date('2019-10-22 13:58:40.3730067');
    byDate.hearings = new Array<BookingsHearingResponse>();

    const bhr = new BookingsHearingResponse();
    bhr.hearing_id = 1;
    bhr.created_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.hearing_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.last_edit_date = new Date('2019-10-22 13:58:40.3730067');
    bhr.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');

    const bhr1 = new BookingsHearingResponse();
    bhr1.hearing_id = 2;

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

    const model = new BookingsListModel(new Date('2019-10-22 13:58:40.3730067'));
    const lists: Array<BookingsDetailsModel> = [];
    const b1 = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    const b2 = new BookingsDetailsModel('2', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    const b3 = new BookingsDetailsModel('3', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));

    lists.push(b1);
    lists.push(b2);
    lists.push(b3);
    model.BookingsDetails = lists;
    return model;
  }

  getTestData1(): BookingsListModel {

    const model = new BookingsListModel(new Date('2019-10-22 13:58:40.3730067'));
    const lists: Array<BookingsDetailsModel> = [];
    const b1 = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    const b2 = new BookingsDetailsModel('2', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    const b3 = new BookingsDetailsModel('6', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));

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
    const model = new BookingsListModel(new Date('2019-10-22 13:58:40.3730067'));
    const lists: Array<BookingsDetailsModel> = [];
    const b1 = new BookingsDetailsModel('11', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    const b2 = new BookingsDetailsModel('12', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    const b3 = new BookingsDetailsModel('33', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));

    lists.push(b1);
    lists.push(b2);
    lists.push(b3);
    const model1 = new BookingsListModel(new Date('2019-11-22 15:58:40.3730067'));
    const b11 = new BookingsDetailsModel('44', new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    const b21 = new BookingsDetailsModel('45', new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    const b31 = new BookingsDetailsModel('46', new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'John Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
    lists.push(b11);
    lists.push(b21);
    lists.push(b31);
    model1.BookingsDetails = lists;
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
  @Output()
  closeDetails = new EventEmitter();
  @Input()
  hearingId: number;
}

describe('BookingsListComponent', () => {
  beforeEach(async(() => {
    const data = new ResponseTestData().getTestData();

    bookingsListServiceSpy.getBookingsList.and.returnValue(of(data));
    const model1 = new BookingslistTestData().getBookings();
    const model2 = new BookingslistTestData().getBookings1();
    const listModel = new ArrayBookingslistModelTestData().getTestData();
    bookingsListServiceSpy.mapBookingsResponse.and.returnValues(model1, model1, model1, model2);
    bookingsListServiceSpy.addBookings.and.returnValue(listModel);

    TestBed.configureTestingModule({
      declarations: [BookingsListComponent, ScrollableDirective, BookingDetailsComponent],
      imports: [HttpClientModule],
      providers: [
        { provide: BookingsListService, useValue: bookingsListServiceSpy },
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
    expect(component.loaded).toBeTruthy();
    expect(component.recordsLoaded).toBeTruthy();
    expect(component.bookings.length).toBe(2);
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

  it('should get error', async(() => {
    bookingsListServiceSpy.getBookingsList.and.returnValue(throwError('bad request'));
    component.ngOnInit();
    expect(component.error).toBeTruthy();
  }));
  it('should select row', () => {
    component.bookings = new ArrayBookingslistModelTestData().getTestData();
    component.ngOnInit();
    fixture.detectChanges();
    component.rowSelected(1, 0)
    expect(component.selectedGroupIndex).toBe(1);
    expect(component.selectedItemIndex).toBe(0);
    expect(component.showDetails).toBeTruthy();
  });
  it('should hide booking details and show booking list', fakeAsync(() => {

    component.selectedGroupIndex = 1;
    component.selectedItemIndex = 0;
    fixture.detectChanges();
    component.closeHearingDetails();
    tick(500);
    fixture.whenStable().then(() => {
      expect(component.showDetails).toBeFalsy();
    });
  }));
});
