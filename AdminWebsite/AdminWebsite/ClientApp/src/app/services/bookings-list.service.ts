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
import { BookingsListModel, BookingsDetailsModel } from '../common/model/bookings-list.model';
import { BookingsModel } from '../common/model/bookings.model';
import moment from 'moment';

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
            const dateA = moment(a.StartTime);
            const dateB = moment(b.StartTime);
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

    private mapBookingsDetails(hearing: BookingsHearingResponse) {
        const details = new BookingsDetailsModel(
            hearing.hearing_id.toString(),
            hearing.scheduled_date_time,
            hearing.scheduled_duration,
            hearing.hearing_number,
            hearing.hearing_name,
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
            hearing.audio_recording_required,
            hearing.cancel_reason,
            hearing.case_type_name,
            hearing.court_room_account,
            '',
            hearing.allocated_to
        );
        details.GroupId = hearing.group_id;
        return details;
    }
}
