import { Component, Input } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { VideoHearingsService } from '../../services/video-hearings.service';

@Component({
    selector: 'app-booking-edit',
    templateUrl: './booking-edit.component.html'
})
export class BookingEditComponent {
    constructor(
        private bookingService: BookingService,
        private videoHearingsService: VideoHearingsService,
        ) {}

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
        return !this.videoHearingsService.isConferenceClosed && !this.videoHearingsService.isHearingAboutToStart;
    }

    edit() {
        this.bookingService.setEditMode();
    }
}
