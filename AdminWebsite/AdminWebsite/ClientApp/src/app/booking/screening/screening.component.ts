import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { SelectedScreeningDto } from './screening.model';
import { EndpointModel } from '../../common/model/endpoint.model';
import { BookingService } from 'src/app/services/booking.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Router } from '@angular/router';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({
    selector: 'app-screening',
    templateUrl: './screening.component.html'
})
export class ScreeningComponent implements OnInit, OnDestroy {
    hearing: VHBooking;

    destroyed$ = new Subject<void>();

    private readonly loggerPrefix: string = '[Booking] Screening (Special Measures) -';

    constructor(
        private readonly router: Router,
        private readonly hearingService: VideoHearingsService,
        private readonly bookingService: BookingService,
        private readonly logger: Logger
    ) {}

    ngOnInit(): void {
        this.hearing = this.hearingService.getCurrentRequest();
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    onScreeningSaved(seletecdMeasuresDto: SelectedScreeningDto) {
        this.logger.debug(`${this.loggerPrefix} screening saved`, seletecdMeasuresDto);

        const participant = this.hearing.participants.find(p => p.display_Name === seletecdMeasuresDto.participantDisplayName);
        const endpoint = this.hearing.endpoints.find(e => e.displayName === seletecdMeasuresDto.participantDisplayName);
        if (participant) {
            participant.screening = {
                measureType: seletecdMeasuresDto.measureType,
                protectFrom: seletecdMeasuresDto.measureType === 'Specific' ? seletecdMeasuresDto.protectFrom : []
            };
        }
        if (endpoint) {
            endpoint.screening = {
                measureType: seletecdMeasuresDto.measureType,
                protectFrom: seletecdMeasuresDto.measureType === 'Specific' ? seletecdMeasuresDto.protectFrom : []
            };
        }
        this.hearingService.updateHearingRequest(this.hearing);
        this.hearing = this.hearing.clone();
    }

    onDeleteEndpointScreening(endpoint: EndpointModel) {
        this.hearing.endpoints.forEach(e => {
            if (e.displayName === endpoint.displayName) {
                e.screening = null;
            }
        });
        this.hearing = this.hearing.clone();
    }

    onDeleteParticipantScreening(participant: VHParticipant) {
        this.hearing.participants.forEach(p => {
            if (p.email === participant.email) {
                p.screening = null;
            }
        });
        this.hearing = this.hearing.clone();
    }

    onContinue() {
        if (this.bookingService.isEditMode()) {
            this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary.`);
            this.router.navigate([PageUrls.Summary]);
        } else {
            this.logger.debug(`${this.loggerPrefix} Navigating to other information.`);
            this.router.navigate([PageUrls.OtherInformation]);
        }
    }
}
