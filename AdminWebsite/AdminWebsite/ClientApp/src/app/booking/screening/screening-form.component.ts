import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { Logger } from 'src/app/services/logger';
import { ProtectFrom, SelectedScreeningDto, ScreeningType } from './screening.model';

@Component({
    selector: 'app-screening-form',
    templateUrl: './screening-form.component.html'
})
export class ScreeningFormComponent {
    @Input() set hearing(hearing: HearingModel) {
        const mappedParticipants = hearing.participants
            .filter(x => x.email)
            .map(
                participant =>
                    ({
                        displayName: participant.display_name,
                        externalReferenceId: participant.externalReferenceId
                    } as GenericParticipantsModel)
            );

        const mappedEndpoints = hearing.endpoints.map(
            endpoint =>
                ({
                    displayName: endpoint.displayName,
                    externalReferenceId: endpoint.externalReferenceId
                } as GenericParticipantsModel)
        );

        this.allParticipants = [...mappedParticipants, ...mappedEndpoints];
        this.createForm();
        this.cdRef.detectChanges();
    }

    @Output() screeningSaved = new EventEmitter<SelectedScreeningDto>();

    displayMeasureType = false;
    displayProtectFromList = false;
    allParticipants: GenericParticipantsModel[];
    availableProtectParticipantFromList: GenericParticipantsModel[] = [];
    selectedProtectParticipantFromList: GenericParticipantsModel[] = [];

    destroyed$ = new Subject<void>();
    form: FormGroup<ScreeningSelectParticipantForm>;

    constructor(private formBuilder: FormBuilder, private cdRef: ChangeDetectorRef, private logger: Logger) {}

    createForm() {
        this.form = this.formBuilder.group<ScreeningSelectParticipantForm>({
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
                this.onParticipantSelected(value);
            }
        });

        this.form.controls.measureType.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
            this.onMeasureTypeSelected(value);
        });
    }

    onMeasureTypeSelected(measureType: ScreeningType) {
        this.displayProtectFromList = measureType === 'Specific';
        if (measureType === 'Specific') {
            const particpant = this.allParticipants.find(participant => participant.displayName === this.form.value.displayName);
            this.initaliseScreening(particpant.displayName);
            this.selectedProtectParticipantFromList = [];
        }
    }

    onParticipantSelected(displayName: string): void {
        this.displayMeasureType = true;
        this.initaliseScreening(displayName);
        this.selectedProtectParticipantFromList = [];
    }

    initaliseScreening(displayName: string) {
        this.availableProtectParticipantFromList = this.allParticipants.filter(participant => participant.displayName !== displayName);
    }

    onSave() {
        const protectFromMapped: ProtectFrom[] = this.selectedProtectParticipantFromList.map(participant => ({
            externalReferenceId: participant.externalReferenceId
        }));
        this.screeningSaved.emit({
            participantDisplayName: this.form.controls.displayName.value,
            protectFrom: protectFromMapped,
            measureType: this.form.controls.measureType.value
        });
        this.form.reset({ displayName: null, measureType: 'All' });
        this.selectedProtectParticipantFromList = [];
        this.displayMeasureType = false;
        this.displayProtectFromList = false;
    }
}

interface ScreeningSelectParticipantForm {
    displayName: FormControl<string>;
    measureType: FormControl<ScreeningType>;
}

interface GenericParticipantsModel {
    displayName: string;
    externalReferenceId: string;
}
