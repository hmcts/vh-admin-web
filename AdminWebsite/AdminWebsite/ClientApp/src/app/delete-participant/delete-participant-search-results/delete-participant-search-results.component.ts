import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantHearingDeleteResultModel } from 'src/app/common/model/participant-hearing-delete-result-model';
import { BookingPersistService } from 'src/app/services/bookings-persist.service';
import { Logger } from 'src/app/services/logger';
import { ParticipantDeleteService } from 'src/app/services/participant-delete-service.service';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-delete-participant-search-results',
    templateUrl: './delete-participant-search-results.component.html',
    styleUrls: ['./delete-participant-search-results.component.scss']
})
export class DeleteParticipantSearchResultsComponent {
    private readonly loggerPrefix = '[DeleteParticipant] -';
    @Input() username: string;
    @Input() results: ParticipantHearingDeleteResultModel[];
    displayConfirmPopup: boolean;
    accountDeleted: boolean;

    constructor(
        private bookingPersistService: BookingPersistService,
        private videoHearingService: VideoHearingsService,
        private participantDeleteService: ParticipantDeleteService,
        private router: Router,
        private returnUrlService: ReturnUrlService,
        private logger: Logger
    ) {
        this.displayConfirmPopup = false;
        this.accountDeleted = false;
    }

    get existsWithoutHearings(): boolean {
        return this.results && !this.results.length;
    }

    get existsWithHearings(): boolean {
        return this.results && !!this.results.length;
    }

    get userNotFound(): boolean {
        return !this.results;
    }

    editHearing(hearingId: string) {
        this.logger.info(`${this.loggerPrefix} Selected to edit hearing`, { hearing: hearingId });
        this.videoHearingService.cancelRequest();
        this.bookingPersistService.selectedHearingId = hearingId;
        this.returnUrlService.setUrl(`${PageUrls.DeleteParticipant}?username=${this.username}`);
        this.router.navigate([PageUrls.BookingDetails]);
    }

    displayConfirmDeleteDialog() {
        this.logger.debug(`${this.loggerPrefix} Displaying modal to confirm deletion`, { username: this.username });
        this.displayConfirmPopup = true;
    }

    async onDeletionAnswer(answer: boolean) {
        this.displayConfirmPopup = false;
        try {
            if (answer) {
                await this.participantDeleteService.deleteUserAccount(this.username);
                this.logger.debug(`${this.loggerPrefix} Successfully deleted username`, { username: this.username });
                this.accountDeleted = true;
            }
        } catch (err) {
            this.logger.error(`${this.loggerPrefix} Failed to delete user`, err, { username: this.username });
            this.accountDeleted = false;
        }
    }
}
