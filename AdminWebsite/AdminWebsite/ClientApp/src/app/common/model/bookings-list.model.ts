import { BookingsListItemModel } from './booking-list-item.model';

export class BookingsListModel {
    constructor(bookingsDate: Date) {
        this.BookingsDate = bookingsDate;
        this.BookingsDetails = [];
    }

    BookingsDate: Date;
    BookingsDetails: Array<BookingsListItemModel>;
}
