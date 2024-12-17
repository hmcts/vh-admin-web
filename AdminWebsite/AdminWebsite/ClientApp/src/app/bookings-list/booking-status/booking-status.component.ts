import { Component, Input } from '@angular/core';
import {
    durationInHoursAndMinutes,
    hasBookingConfirmationFailed,
    hasConfirmationWithNoJudge,
    isCancelled,
    isCreated,
    VHBooking
} from 'src/app/common/model/vh-booking';
@Component({
    selector: 'app-booking-status',
    templateUrl: './booking-status.component.html',
    styleUrls: ['./booking-status.component.scss']
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

    public get duration(): string {
        return durationInHoursAndMinutes(this.bookingDetails);
    }

    public get isCancelled(): boolean {
        return isCancelled(this.bookingDetails);
    }

    public get isCreated(): boolean {
        return isCreated(this.bookingDetails);
    }

    public get hasBookingConfirmationFailed(): boolean {
        return hasBookingConfirmationFailed(this.bookingDetails);
    }

    public get hasConfirmationWithNoJudge(): boolean {
        return hasConfirmationWithNoJudge(this.bookingDetails);
    }
}
