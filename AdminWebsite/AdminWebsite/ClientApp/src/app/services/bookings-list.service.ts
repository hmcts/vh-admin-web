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

  constructor(private bhClient: BHClient) { }

  getBookingsList(cursor: string, limit: number): Observable<BookingsResponse> {
    return this.bhClient.getBookingsList(cursor, limit);
  }

  mapBookingsResponse(bookingsResponse: BookingsResponse): BookingsModel {
    const model = new BookingsModel(bookingsResponse.next_cursor);
    model.Hearings = bookingsResponse.hearings.map(x => this.mapBookings(x));
    return model;
  }

  replaceBookingRecord(booking: BookingsDetailsModel, bookings: Array<BookingsListModel>) {
    const dateOnly = new Date(booking.StartTime.valueOf());
    const dateNoTime = new Date(dateOnly.setHours(0, 0, 0, 0));
    const bookingModel = new BookingsListModel(dateNoTime);
    bookingModel.BookingsDetails = [booking];
    if (booking.IsStartTimeChanged) {
      this.deleteDuplicatedRecord(bookingModel, bookings);
    }
    this.addRecords(bookingModel, bookings);
  }

  addBookings(bookingsModel: BookingsModel, bookings: Array<BookingsListModel>): Array<BookingsListModel> {
    bookingsModel.Hearings.forEach(element => {
      this.addRecords(element, bookings);
    });

    return bookings;
  }

  // append a new set of data to list
  private addRecords(element: BookingsListModel, bookings: Array<BookingsListModel>) {
    const subSet = bookings.findIndex(s => s.BookingsDate.toString() === element.BookingsDate.toString());
    if (subSet > -1) {
      element.BookingsDetails.forEach(item => {
        const record = bookings[subSet].BookingsDetails.find(x => x.HearingId === item.HearingId);
        if (!record) {
          this.insertBookingIntoGroup(item, bookings[subSet]);
        }
      });
    } else {
      // The group with the date is not found, we have to check
      // if the record date was edited or it's a new record with a new date group.
      this.deleteDuplicatedRecord(element, bookings);
      this.insertDateGroup(element, bookings);
    }
  }

  private deleteDuplicatedRecord(element: BookingsListModel, bookings: Array<BookingsListModel>) {
    const hearings = element.BookingsDetails;
    const groupsToDelete: number[] = [];
    hearings.forEach(hearing => {
      for (let j = 0; j < bookings.length; j++) {
        for (let i = 0; i < bookings[j].BookingsDetails.length; i++) {

          if (bookings[j].BookingsDetails[i].HearingId === hearing.HearingId) {
            bookings[j].BookingsDetails.splice(i, 1);
          }
          if (!bookings[j].BookingsDetails || bookings[j].BookingsDetails.length === 0) {
            groupsToDelete.push(j);
          }
        }
      }
    });
    groupsToDelete.forEach(g => {
      // remove empty group
      bookings.splice(g, 1);
    });
  }

  private insertBookingIntoGroup(element: BookingsDetailsModel, groupBookings: BookingsListModel) {
    groupBookings.BookingsDetails.push(element);
    groupBookings.BookingsDetails.sort((a, b) => {
      if (new Date(a.StartTime) < new Date(b.StartTime)) { return -1; }
      if (new Date(a.StartTime) > new Date(b.StartTime)) { return 1; }
      if (new Date(a.StartTime) === new Date(b.StartTime)) { return 0; }
    });
  }

  private insertDateGroup(element: BookingsListModel, bookings: Array<BookingsListModel>) {
    bookings.push(element);
    bookings.sort((a, b) => {
      if (new Date(a.BookingsDate) < new Date(b.BookingsDate)) { return -1; }
      if (new Date(a.BookingsDate) > new Date(b.BookingsDate)) { return 1; }
      if (new Date(a.BookingsDate) === new Date(b.BookingsDate)) { return 0; }
    });
  }

  private mapBookings(bookingsByDate: BookingsByDateResponse): BookingsListModel {
    const dateOnly = new Date(bookingsByDate.scheduled_date.valueOf());
    const dateNoTime = new Date(dateOnly.setHours(0, 0, 0, 0));
    const model = new BookingsListModel(dateNoTime);
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
      hearing.last_edit_date,
      hearing.confirmed_by,
      hearing.confirmed_date,
      hearing.status,
      hearing.questionnaire_not_required,
      hearing.audio_recording_required,
      hearing.cancel_reason,
      hearing.case_type_name
    );
  }
}



