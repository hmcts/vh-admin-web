import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { Logger } from 'src/app/services/logger';
import { SelectedSpecialMeasuresuremensDto, SpecialMeasureType } from './special-measures.model';

@Component({
    selector: 'app-special-measures-form',
    templateUrl: './special-measures-form.component.html',
    styleUrls: ['./special-measures-form.component.scss']
})
export class SpecialMeasuresFormComponent {
    @Input() set hearing(hearing: HearingModel) {
        this.allParticipants = hearing.participants
            .filter(x => x.email)
            .map(participant => {
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

    @Output() specialMeasurementSaved = new EventEmitter<SelectedSpecialMeasuresuremensDto>();

    displayMeasureType = false;
    displayProtectFromList = false;
    allParticipants: GenericParticipantsModel[];
    availableProtectParticipantFromList: GenericParticipantsModel[] = [];
    selectedProtectParticipantFromList: GenericParticipantsModel[] = [];

    destroyed$ = new Subject<void>();
    form: FormGroup<SpecialMeasuresSelectParticipantForm>;

    private readonly loggerPrefix: string = '[Booking] Special Measures Form -';

    constructor(private formBuilder: FormBuilder, private cdRef: ChangeDetectorRef, private logger: Logger) {}

    createForm() {
        this.form = this.formBuilder.group<SpecialMeasuresSelectParticipantForm>({
            displayName: new FormControl(null),
            measureType: new FormControl('All')
        });

        this.form.controls.displayName.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
            if (value === 'null') {
                this.availableProtectParticipantFromList = [];
                this.displayMeasureType = false;
                return;
            }
            if (value) {
                const particpant = this.allParticipants.find(participant => participant.displayName === value);
                this.onParticipantSelected(particpant);
            }
        });

        this.form.controls.measureType.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
            this.onMeasureTypeSelected(value);
        });
    }

    onMeasureTypeSelected(measureType: SpecialMeasureType) {
        this.displayProtectFromList = measureType === 'Specific';
        if (measureType === 'Specific') {
            const particpant = this.allParticipants.find(participant => participant.displayName === this.form.value.displayName);
            this.initaliseSpecialMeasures(particpant.displayName);
            this.selectedProtectParticipantFromList = [];
        }
    }

    onParticipantSelected(participant: GenericParticipantsModel): void {
        // this.logger.debug(`${this.loggerPrefix} Participant selected: ${participant.displayName}`);
        // this.initaliseSpecialMeasures(participant.displayName);
        // this.selectedProtectParticipantFromList = [];
        this.displayMeasureType = true;
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
            protectFrom: this.selectedProtectParticipantFromList,
            measureType: this.form.controls.measureType.value
        });
        this.form.reset({ displayName: null, measureType: 'All' });
        this.selectedProtectParticipantFromList = [];
        this.displayMeasureType = false;
        this.displayProtectFromList = false;
    }
}

interface SpecialMeasuresSelectParticipantForm {
    displayName: FormControl<string>;
    measureType: FormControl<SpecialMeasureType>;
}

interface GenericParticipantsModel {
    displayName: string;
    contactEmail: string;
}
