import { Component, EventEmitter, Input, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantModel } from '../../common/model/participant.model';
import { BookingService } from '../../services/booking.service';

@Component({
    selector: 'app-participants-list',
    templateUrl: './participants-list.component.html',
    styleUrls: ['./participants-list.component.css']
})
export class ParticipantsListComponent implements OnInit {
    private readonly loggerPrefix = '[ParticipantsList] -';
    @Input()
    participants: (ParticipantModel & { isRepresentative: boolean })[];

    $selectedForEdit: EventEmitter<string>;
    $selectedForRemove: EventEmitter<string>;

    isSummaryPage = false;
    isEditRemoveVisible = true;

    isEditMode = false;

    constructor(private bookingService: BookingService, private router: Router, private logger: Logger) {
        this.$selectedForEdit = new EventEmitter<string>();
        this.$selectedForRemove = new EventEmitter<string>();
    }

    ngOnChanges(changes: SimpleChanges) {
        (changes.participants.currentValue as (ParticipantModel & { isRepresentative: boolean })[]).forEach(p => {
            p.isRepresentative = !!p.representee;
        });
    }

    ngOnInit() {
        const currentUrl = this.router.url;
        if (currentUrl) {
            this.isSummaryPage = currentUrl.includes('summary');
            this.isEditRemoveVisible = !currentUrl.includes('assign-judge');
        }
    }

    editJudge() {
        this.bookingService.setEditMode();
    }

    editParticipant(participantEmail: string) {
        this.bookingService.setEditMode();
        if (this.isSummaryPage) {
            this.bookingService.setParticipantEmail(participantEmail);
            this.logger.debug(`${this.loggerPrefix} Navigating back to participants to edit`, { participant: participantEmail });
            this.router.navigate([PageUrls.AddParticipants]);
        } else {
            // we are on the add participant page
            this.$selectedForEdit.emit(participantEmail);
        }
    }

    removeParticipant(participantEmail: string) {
        this.logger.debug(`${this.loggerPrefix} Removing participant`, { participant: participantEmail });
        this.$selectedForRemove.emit(participantEmail);
    }

    get selectedParticipant() {
        return this.$selectedForEdit;
    }

    get selectedParticipantToRemove() {
        return this.$selectedForRemove;
    }
}
