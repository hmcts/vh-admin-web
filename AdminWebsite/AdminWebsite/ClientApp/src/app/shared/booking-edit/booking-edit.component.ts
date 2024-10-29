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
        private readonly bookingService: BookingService,
        private readonly videoHearingsService: VideoHearingsService,
        private readonly featureService: LaunchDarklyService
    ) {
        this.featureService
            .getFlag<boolean>(FeatureFlags.multiDayBookingEnhancements)
            .pipe(first())
            .subscribe(result => {
                this.multiDayBookingEnhancementsEnabled = result;
            });
    }

    multiDayBookingEnhancementsEnabled: boolean;
    private _editLink = '/';

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
        return !this.videoHearingsService.isConferenceClosed() && !this.videoHearingsService.isHearingAboutToStart();
    }

    edit() {
        this.bookingService.setEditMode();
    }
}
