import { Component, Input } from '@angular/core';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
@Component({
    selector: 'app-booking-status',
    templateUrl: './booking-status.component.html',
    styleUrls: ['./booking-status.component.scss']
})
export class BookingStatusComponent {
    @Input() bookingDetails: BookingsDetailsModel;

    public get statusMessage(): string {
        switch (this.bookingDetails.Status) {
            case 'Created':
            case 'ConfirmedWithoutJudge':
                return 'Confirmed';
            case 'Cancelled':
                return 'Cancelled';
            case 'Failed':
                return 'Failed';
            default:
                return null;
        }
    }

    public get hasNoJudge(): boolean {
        return this.bookingDetails.Status === 'BookedWithoutJudge' || this.bookingDetails.Status === 'ConfirmedWithoutJudge';
    }
}
