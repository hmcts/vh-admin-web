import { BookingsListModel } from './bookings-list.model';

export class BookingsModel {
    constructor(next_cursor: string) {
        this.NextCursor = next_cursor;
        this.Hearings = [];
    }
    Hearings: Array<BookingsListModel>;
    NextCursor: string;

}