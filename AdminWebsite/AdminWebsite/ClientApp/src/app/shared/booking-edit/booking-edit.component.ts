import { Component, Input } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { first } from 'rxjs';
import { LaunchDarklyService, FeatureFlags } from 'src/app/services/launch-darkly.service';

@Component({
    selector: 'app-booking-edit',
    templateUrl: './booking-edit.component.html'
})
export class BookingEditComponent {
    constructor(
        private bookingService: BookingService,
        private videoHearingsService: VideoHearingsService,
        private featureService: LaunchDarklyService
    ) {
        this.featureService
            .getFlag<boolean>(FeatureFlags.multiDayBookingEnhancements)
            .pipe(first())
            .subscribe(result => {
                this.multiDayBookingEnhancementsEnabled = result;
            });
    }

    private _editLink = '/';
    private multiDayBookingEnhancementsEnabled: boolean;

    @Input()
    title: string;

    @Input()
    set editLink(editLink: string) {
        this._editLink = `/${editLink}`;
    }

    @Input()
    elementId: string;

    get editLink() {
        return this._editLink;
    }

    get canEdit() {
        if (this.videoHearingsService.isConferenceClosed() || this.videoHearingsService.isHearingAboutToStart()) {
            return false;
        }

        const booking = this.videoHearingsService.getCurrentRequest();
        if (booking.isMultiDay && this.multiDayBookingEnhancementsEnabled) {
            return false;
        }

        return true;
    }

    edit() {
        this.bookingService.setEditMode();
    }
}
