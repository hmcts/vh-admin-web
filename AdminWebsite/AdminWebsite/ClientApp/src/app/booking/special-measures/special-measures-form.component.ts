import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { Logger } from 'src/app/services/logger';

@Component({
    selector: 'app-special-measures-form',
    templateUrl: './special-measures-form.component.html',
    styleUrls: ['./special-measures-form.component.scss']
})
export class SpecialMeasuresFormComponent {
    @Input() set hearing(hearing: HearingModel) {
        this.allParticipants = hearing.participants.map(participant => {
            return {
                contactEmail: participant.email,
                displayName: participant.display_name
            } as GenericParticipantsModel;
        });

        const mappedEndpoints = hearing.endpoints.map(endpoint => {
            return {
                contactEmail: null,
                displayName: endpoint.displayName
            } as GenericParticipantsModel;
        });

        this.allParticipants = [...this.allParticipants, ...mappedEndpoints];
        this.createForm();
        this.cdRef.detectChanges();
    }

    @Output() specialMeasurementSaved = new EventEmitter<SpecialMeasuresuremensDto>();

    allParticipants: GenericParticipantsModel[];
    availableProtectParticipantFromList: GenericParticipantsModel[] = [];
    selectedProtectParticipantFromList: GenericParticipantsModel[] = [];

    destroyed$ = new Subject<void>();
    form: FormGroup<SpecialMeasuresSelectParticipantForm>;

    private readonly loggerPrefix: string = '[Booking] Special Measures Form -';

    constructor(private formBuilder: FormBuilder, private cdRef: ChangeDetectorRef, private logger: Logger) {}

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

    onSave() {
        this.specialMeasurementSaved.emit({
            participantDisplayName: this.form.controls.displayName.value,
            protectFrom: this.selectedProtectParticipantFromList
        });
        this.form.reset({ displayName: null });
    }
}

interface SpecialMeasuresSelectParticipantForm {
    displayName: FormControl<string>;
}

interface GenericParticipantsModel {
    displayName: string;
    contactEmail: string;
}

export interface SpecialMeasuresuremensDto {
    participantDisplayName: string;
    protectFrom: {
        contactEmail: string;
        displayName: string;
    }[];
}
