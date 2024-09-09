import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';

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
}

interface GenericParticipantsModel {
    displayName: string;
    contactEmail: string;
}
