import { Injectable } from '@angular/core';
import { BHClient, BookingsResponse, BookingsHearingResponse, BookingsByDateResponse } from './clients/api-client';
import { Observable } from 'rxjs';
import { BookingsListModel, BookingsDetailsModel } from '../common/model/bookings-list.model';
import { BookingsModel } from '../common/model/bookings.model';

@Injectable({
  providedIn: 'root'
})
export class BookingsListService {
  bookingsList: Array<BookingsListModel> = [];
  indexBook = 1;

  constructor(private bhClient: BHClient) { }

  getBookingsList(cursor: string, limit: number): Observable<BookingsResponse> {
    return this.bhClient.getBookingsList(cursor, limit);
  }

  mapBookingsResponse(bookingsResponse: BookingsResponse): BookingsModel {
     const model = new BookingsModel(bookingsResponse.next_cursor);
     model.Hearings = bookingsResponse.hearings.map(x => this.mapBookings(x));
     return model;
    }

    addBookings(bookingsModel: BookingsModel, bookings: Array<BookingsListModel>): Array<BookingsListModel> {
        bookingsModel.Hearings.forEach(element => {
            this.addRecords(element, bookings);
        });

        return bookings;
    }

    private addRecords(element: BookingsListModel, bookings: Array<BookingsListModel>) {
        const subSet = bookings.findIndex(s => s.BookingsDate.toString() === element.BookingsDate.toString());
        if (subSet > -1) {
            element.BookingsDetails.forEach(item => {
                const record = bookings[subSet].BookingsDetails.find(x => x.HearingId === item.HearingId);
                if (!record) {
                    bookings[subSet].BookingsDetails.push(item);
                }
            });
        } else {
            bookings.push(element);
        }
    }

  private mapBookings(bookingsByDate: BookingsByDateResponse): BookingsListModel {
    const model = new BookingsListModel(bookingsByDate.scheduled_date);
    model.BookingsDetails = bookingsByDate.hearings.map(hearing => this.mapBookingsDetails(hearing));
    return model;
}

  private mapBookingsDetails(hearing: BookingsHearingResponse) {
    return new BookingsDetailsModel(
      hearing.hearing_id.toString(),
      hearing.scheduled_date_time,
      hearing.scheduled_duration,
      hearing.hearing_number,
      hearing.hearing_name,
      hearing.hearing_type_name,
      hearing.judge_name,
      hearing.court_room,
      hearing.court_address,
      hearing.created_by,
      hearing.created_date,
      hearing.last_edit_by,
      hearing.last_edit_date);
  }
}



