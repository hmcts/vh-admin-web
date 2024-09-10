import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { SelectedSpecialMeasuresuremensDto, SpecialMeasuresuremensDto } from './special-measures.model';

@Component({
    selector: 'app-special-measures',
    templateUrl: './special-measures.component.html'
})
export class SpecialMeasuresComponent implements OnInit, OnDestroy {
    hearing: HearingModel;

    destroyed$ = new Subject<void>();

    private readonly loggerPrefix: string = '[Booking] Special Measures -';

    constructor(private hearingService: VideoHearingsService, private logger: Logger) {}

    ngOnInit(): void {
        // init judicial office holders from cache if exists
        this.hearing = this.hearingService.getCurrentRequest();
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    onSpecialMeasurementSaved(seletecdMeasuresDto: SelectedSpecialMeasuresuremensDto) {
        this.logger.debug(`${this.loggerPrefix} Special Measurement saved`, seletecdMeasuresDto);
        const participant = this.hearing.participants.find(p => p.display_name === seletecdMeasuresDto.participantDisplayName);
        if (participant) {
            const specialMeasure: SpecialMeasuresuremensDto = {
                measureType: seletecdMeasuresDto.measureType,
                protectFrom: seletecdMeasuresDto.measureType === 'Specific' ? seletecdMeasuresDto.protectFrom : []
            };

            participant.special_measures = specialMeasure;
        }
        this.hearingService.updateHearingRequest(this.hearing);
    }
}
