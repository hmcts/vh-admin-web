import { Component, Input } from '@angular/core';
import { VHBooking } from 'src/app/common/model/vh-booking';
@Component({
    selector: 'app-booking-status',
    templateUrl: './booking-status.component.html',
    styleUrls: ['./booking-status.component.scss'],
    standalone: false
})
export class BookingStatusComponent {
    @Input() bookingDetails: VHBooking;
    @Input() showTime = false;

    public get statusMessage(): string {
        switch (this.bookingDetails.status) {
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
        return this.bookingDetails.status === 'BookedWithoutJudge' || this.bookingDetails.status === 'ConfirmedWithoutJudge';
    }
}
