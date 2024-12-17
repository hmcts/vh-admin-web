import { Injectable } from '@angular/core';
import {
    BHClient,
    BookingsResponse,
    BookingsHearingResponse,
    BookingsByDateResponse,
    BookingSearchRequest,
    IBookingSearchRequest
} from './clients/api-client';
import { Observable } from 'rxjs';
import { BookingsListModel } from '../common/model/bookings-list.model';
import { BookingsModel } from '../common/model/bookings.model';
import moment from 'moment';
import { BookingsListItemModel } from '../common/model/booking-list-item.model';
import { mapBookingsHearingResponseToVHBooking } from '../common/model/api-contract-to-client-model-mappers';

@Injectable({
    providedIn: 'root'
})
export class BookingsListService {
    bookingsList: Array<BookingsListModel> = [];

    constructor(private readonly bhClient: BHClient) {}

    getBookingsList(
        cursor: string,
        limit: number,
        caseNumber?: string,
        venueIds?: number[],
        caseTypes?: string[],
        selectedUsers?: string[],
        startDate?: Date,
        endDate?: Date,
        lastName?: string,
        noJudge?: boolean,
        noAllocated?: boolean
    ): Observable<BookingsResponse> {
        if (noJudge == null || undefined) {
            noJudge = false;
        }
        if (noAllocated == null || undefined) {
            noAllocated = false;
        }
        const searchRequest = {
            cursor,
            limit,
            caseNumber,
            venueIds,
            caseTypes,
            selectedUsers,
            startDate,
            endDate,
            lastName,
            noJudge,
            noAllocated
        } as IBookingSearchRequest;
        const model = new BookingSearchRequest(searchRequest);
        return this.bhClient.bookingsList(model);
    }

    mapBookingsResponse(bookingsResponse: BookingsResponse): BookingsModel {
        const model = new BookingsModel(bookingsResponse.next_cursor);
        model.Hearings = bookingsResponse.hearings.map(x => this.mapBookings(x));
        return model;
    }

    replaceBookingRecord(booking: BookingsListItemModel, bookings: Array<BookingsListModel>) {
        const dateOnly = new Date(booking.Booking.scheduled_date_time.valueOf());
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
                const record = bookings[subSet].BookingsDetails.find(x => x.Booking.hearing_id === item.Booking.hearing_id);
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
                    if (bookings[j].BookingsDetails[i].Booking.hearing_id === hearing.Booking.hearing_id) {
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

    private insertBookingIntoGroup(element: BookingsListItemModel, groupBookings: BookingsListModel) {
        groupBookings.BookingsDetails.push(element);
        groupBookings.BookingsDetails.sort((a, b) => {
            const dateA = moment(a.Booking.scheduled_date_time);
            const dateB = moment(b.Booking.scheduled_date_time);
            if (dateA.isBefore(dateB)) {
                return -1;
            }
            if (dateA.isAfter(dateB)) {
                return 1;
            }
            if (dateA.isSame(dateB)) {
                return 0;
            }
        });
    }

    private insertDateGroup(element: BookingsListModel, bookings: Array<BookingsListModel>) {
        bookings.push(element);
        bookings.sort((a, b) => {
            const dateA = moment(a.BookingsDate);
            const dateB = moment(b.BookingsDate);
            if (dateA.isBefore(dateB)) {
                return -1;
            }
            if (dateA.isAfter(dateB)) {
                return 1;
            }
            if (dateA.isSame(dateB)) {
                return 0;
            }
        });
    }

    private mapBookings(bookingsByDate: BookingsByDateResponse): BookingsListModel {
        const dateOnly = new Date(bookingsByDate.scheduled_date.valueOf());
        const dateNoTime = new Date(dateOnly.setHours(0, 0, 0, 0));
        const model = new BookingsListModel(dateNoTime);
        model.BookingsDetails = bookingsByDate.hearings.map(hearing => this.mapBookingsDetails(hearing));
        return model;
    }

    private mapBookingsDetails(hearing: BookingsHearingResponse): BookingsListItemModel {
        const details = new BookingsListItemModel(mapBookingsHearingResponseToVHBooking(hearing));
        return details;
    }
}
