import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Output, EventEmitter, Directive } from '@angular/core';
import { BookingsListComponent } from './bookings-list.component';
import { of, Observable} from 'rxjs';
import 'rxjs/add/observable/throw';
import { HttpClientModule } from '@angular/common/http';
import { BookingsModel } from '../../common/model/bookings.model';
import { BookingsListService } from '../../services/bookings-list.service';
import { BookingsListModel, BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { BookingsResponse, BookingsByDateResponse, BookingsHearingResponse} from '../../services/clients/api-client';

let component: BookingsListComponent;
let fixture: ComponentFixture<BookingsListComponent>;
let bookingsListServiceSpy: jasmine.SpyObj<BookingsListService>;
bookingsListServiceSpy = jasmine.createSpyObj<BookingsListService>('BookingsListService', ['getBookingsList','mapBookingsResponse','addBookings']);

@Directive({ selector: 'app-scrollable' })
class ScrollableDirective {
    @Output() scrollPosition = new EventEmitter();
}

describe('BookingsListComponent', () => {
    beforeEach(async(() => {
      
        let data = new ResponseTestData().getTestData(); 
       
        bookingsListServiceSpy.getBookingsList.and.returnValue(of(data));
       let model1 = new BookingslistTestData().getBookings();
        let model2 = new BookingslistTestData().getBookings1();
        let listModel = new ArrayBookingslistModelTestData().getTestData();
        bookingsListServiceSpy.mapBookingsResponse.and.returnValues(model1, model1, model1, model2);
        bookingsListServiceSpy.addBookings.and.returnValue(listModel);

        TestBed.configureTestingModule({
            declarations: [BookingsListComponent, ScrollableDirective],
            imports: [HttpClientModule],
            providers: [
                { provide: BookingsListService, useValue: bookingsListServiceSpy },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BookingsListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
       
    }));

    it('should create bookingslist component', (() => {
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

    it('should add bookings list records on next scroll and delete duplicated hearings', async(() => {
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
        bookingsListServiceSpy.getBookingsList.and.returnValue(Observable.throw('bad request'));
        component.ngOnInit();
        expect(component.error).toBeTruthy();
    }));
 
});

export class ResponseTestData {

    getTestData(): BookingsResponse {
        let response = new BookingsResponse();
        let byDate = new BookingsByDateResponse();
        byDate.scheduled_date = new Date('2019-10-22 13:58:40.3730067');
        byDate.hearings = new Array<BookingsHearingResponse>();
    
        let bhr = new BookingsHearingResponse();
        bhr.hearing_id = 1;
        bhr.created_date = new Date('2019-10-22 13:58:40.3730067');
        bhr.hearing_date = new Date('2019-10-22 13:58:40.3730067');
        bhr.last_edit_date = new Date('2019-10-22 13:58:40.3730067');
        bhr.scheduled_date_time = new Date('2019-10-22 13:58:40.3730067');
    
        let bhr1 = new BookingsHearingResponse();
        bhr1.hearing_id = 2;
    
        byDate.hearings.push(bhr);
        byDate.hearings.push(bhr1);
    
        response.hearings = new Array<BookingsByDateResponse>();
        response.hearings.push(byDate);
        response.next_cursor = "12345670_3";
        return response;
    }
}

export class BookingslistTestData {

    getBookings():BookingsModel{
        let model = new BookingsModel("1233");
        model.Hearings.push(this.getTestData());

        return model;
    }

    getBookings1():BookingsModel{
        let model = new BookingsModel("1234");
        model.Hearings.push(this.getTestData1());

        return model;
    }
 
    getTestData(): BookingsListModel {
       
        let model = new BookingsListModel(new Date('2019-10-22 13:58:40.3730067'))
        let lists: Array<BookingsDetailsModel> = [];
        let b1 = new BookingsDetailsModel(1, new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        let b2 = new BookingsDetailsModel(2, new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        let b3 = new BookingsDetailsModel(3, new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
 
        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
       model.BookingsDetails = lists
        return model;
    }

    getTestData1(): BookingsListModel {
       
        let model = new BookingsListModel(new Date('2019-10-22 13:58:40.3730067'))
        let lists: Array<BookingsDetailsModel> = [];
        let b1 = new BookingsDetailsModel(1, new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        let b2 = new BookingsDetailsModel(2, new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
        let b3 = new BookingsDetailsModel(6, new Date('2019-10-22 13:58:40.3730067'),
            120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
            'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
 
        lists.push(b1);
        lists.push(b2);
        lists.push(b3);
       model.BookingsDetails = lists
        return model;
    }
}

    export class ArrayBookingslistModelTestData {
 
        getTestData(): Array<BookingsListModel> {
            let listModel: Array<BookingsListModel> = [];
            let model = new BookingsListModel(new Date('2019-10-22 13:58:40.3730067'))
            let lists: Array<BookingsDetailsModel> = [];
            let b1 = new BookingsDetailsModel(11, new Date('2019-10-22 13:58:40.3730067'),
                120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
                'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
            let b2 = new BookingsDetailsModel(12, new Date('2019-10-22 13:58:40.3730067'),
                120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
                'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
            let b3 = new BookingsDetailsModel(33, new Date('2019-10-22 13:58:40.3730067'),
                120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
                'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
     
            lists.push(b1);
            lists.push(b2);
            lists.push(b3);
            let model1 = new BookingsListModel(new Date('2019-11-22 15:58:40.3730067'))
            let b11 = new BookingsDetailsModel(44, new Date('2019-11-22 13:58:40.3730067'),
                120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
                'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
            let b21 = new BookingsDetailsModel(45, new Date('2019-11-22 13:58:40.3730067'),
                120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
                'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
            let b31 = new BookingsDetailsModel(46, new Date('2019-11-22 13:58:40.3730067'),
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
}
