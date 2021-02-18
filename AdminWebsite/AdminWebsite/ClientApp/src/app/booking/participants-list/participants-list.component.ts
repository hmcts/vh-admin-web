import { Component, ComponentFactoryResolver, EventEmitter, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { OtherInformationModel } from 'src/app/common/model/other-information.model';
import { Logger } from 'src/app/services/logger';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantModel } from '../../common/model/participant.model';
import { BookingService } from '../../services/booking.service';

@Component({
    selector: 'app-participants-list',
    templateUrl: './participants-list.component.html',
    styleUrls: ['./participants-list.component.css']
})
export class ParticipantsListComponent implements OnInit, OnChanges {
    private readonly loggerPrefix = '[ParticipantsList] -';
    @Input()
    hearing: HearingModel;
    otherInformationDetails: OtherInformationModel;
    judgeEmailAvailable: boolean;
    judgePhoneAvailable: boolean;

    $selectedForEdit: EventEmitter<string>;
    $selectedForRemove: EventEmitter<string>;

    isSummaryPage = false;
    isEditRemoveVisible = true;

    isEditMode = false;

    constructor(private bookingService: BookingService, private router: Router, private logger: Logger) {
        this.$selectedForEdit = new EventEmitter<string>();
        this.$selectedForRemove = new EventEmitter<string>();
    }

    ngOnInit() {
        const currentUrl = this.router.url;
        this.otherInformationDetails = OtherInformationModel.init(this.hearing.other_information);
        if (currentUrl) {
            this.isSummaryPage = currentUrl.includes('summary');
            this.isEditRemoveVisible = !currentUrl.includes('assign-judge');
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log(changes);
        if (changes.hearings) {
            this.otherInformationDetails = OtherInformationModel.init(this.hearing.other_information);
            this.judgeEmailAvailable = this.otherInformationDetails.judgeEmail ? true : false;
            this.judgePhoneAvailable = this.otherInformationDetails.judgePhone ? true : false;
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
