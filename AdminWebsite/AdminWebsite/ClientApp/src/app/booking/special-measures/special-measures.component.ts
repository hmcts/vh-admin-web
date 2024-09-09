import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';

@Component({
    selector: 'app-special-measures',
    templateUrl: './special-measures.component.html',
    styleUrl: './special-measures.component.scss'
})
export class SpecialMeasuresComponent implements OnInit, OnDestroy {
    hearing: HearingModel;
    allParticipants: GenericParticipantsModel[];

    availableProtectParticipantFromList: GenericParticipantsModel[] = [];
    selectedProtectParticipantFromList: GenericParticipantsModel[] = [];

    form: FormGroup<SpecialMeasuresSelectParticipantForm>;

    destroyed$ = new Subject<void>();

    private readonly loggerPrefix: string = '[Booking] Special Measures -';

    constructor(private hearingService: VideoHearingsService, private formBuilder: FormBuilder, private logger: Logger) {}

    ngOnInit(): void {
        // init judicial office holders from cache if exists
        this.hearing = this.hearingService.getCurrentRequest();
        const mappedParticipants = this.hearing.participants.map(participant => {
            return {
                contactEmail: participant.email,
                displayName: participant.display_name
            } as GenericParticipantsModel;
        });

        const mappedEndpoints = this.hearing.endpoints.map(endpoint => {
            return {
                contactEmail: null,
                displayName: endpoint.displayName
            } as GenericParticipantsModel;
        });

        this.allParticipants = [...mappedParticipants, ...mappedEndpoints];
        this.createForm();
    }

    createForm() {
        this.form = this.formBuilder.group<SpecialMeasuresSelectParticipantForm>({
            displayName: new FormControl(null)
        });

        this.form.controls.displayName.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
            if (value === 'null') {
                this.availableProtectParticipantFromList = [];
                return;
            }
            if (value) {
                const particpant = this.allParticipants.find(participant => participant.displayName === value);
                this.onParticipantSelected(particpant);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    onParticipantSelected(participant: GenericParticipantsModel): void {
        this.logger.debug(`${this.loggerPrefix} Participant selected: ${participant.displayName}`);
        this.initaliseSpecialMeasures(participant.displayName);
        this.selectedProtectParticipantFromList = [];
    }

    initaliseSpecialMeasures(displayName: string) {
        this.availableProtectParticipantFromList = this.allParticipants.filter(participant => participant.displayName !== displayName);
    }

    selectAll() {
        this.selectedProtectParticipantFromList = this.availableProtectParticipantFromList;
    }

    unselectAll() {
        this.selectedProtectParticipantFromList = [];
    }
}

interface SpecialMeasuresSelectParticipantForm {
    displayName: FormControl<string>;
}

interface GenericParticipantsModel {
    displayName: string;
    contactEmail: string;
}

interface SpecialMeasureDto {
    protectFrom: string[];
}
