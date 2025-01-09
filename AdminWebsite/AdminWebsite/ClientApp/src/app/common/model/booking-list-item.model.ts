import { VHBooking } from './vh-booking';

export class BookingsListItemModel {
    constructor(booking: VHBooking) {
        this.Booking = booking;
        this.Selected = false;
        this.IsStartTimeChanged = false;
    }

    Booking: VHBooking;
    Selected: boolean;
    IsStartTimeChanged: boolean;
}
