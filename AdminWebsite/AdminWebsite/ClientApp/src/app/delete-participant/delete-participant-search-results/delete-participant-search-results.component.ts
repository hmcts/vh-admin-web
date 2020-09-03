import { Component, Input } from '@angular/core';
import { ParticipantHearingDeleteResultModel } from 'src/app/common/model/participant-hearing-delete-result-model';
import { BookingPersistService } from 'src/app/services/bookings-persist.service';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-delete-participant-search-results',
    templateUrl: './delete-participant-search-results.component.html',
    styleUrls: ['./delete-participant-search-results.component.scss']
})
export class DeleteParticipantSearchResultsComponent {
    @Input() results: ParticipantHearingDeleteResultModel[];

    constructor(
        private bookingPersistService: BookingPersistService,
        private videoHearingService: VideoHearingsService,
        private router: Router
    ) {}

    get existsWithoutHearings(): boolean {
        return this.results && this.results.length === 0;
    }

    get existsWithHearings() {
        return this.results && this.results.length > 0;
    }

    get userNotFound() {
        return this.results === null;
    }

    editHearing(hearingId: string) {
        this.videoHearingService.cancelRequest();
        this.bookingPersistService.selectedHearingId = hearingId;
        this.router.navigate([PageUrls.BookingDetails]);
    }
}
