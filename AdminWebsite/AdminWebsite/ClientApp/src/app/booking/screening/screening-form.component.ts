import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ProtectFrom, ScreeningType, SelectedScreeningDto } from './screening.model';

@Component({
    selector: 'app-screening-form',
    templateUrl: './screening-form.component.html'
})
export class ScreeningFormComponent {
    isEditMode = false;
    newParticipantRemovedFromOptions = false;

    constructor(private formBuilder: FormBuilder, private cdRef: ChangeDetectorRef) {}

    @Output() screeningSaved = new EventEmitter<SelectedScreeningDto>();

    displayMeasureType = false;
    displayProtectFromList = false;
    allParticipants: GenericParticipantsModel[];
    availableProtectParticipantFromList: GenericParticipantsModel[] = [];
    selectedProtectParticipantFromList: GenericParticipantsModel[] = [];

    destroyed$ = new Subject<void>();
    form: FormGroup<ScreeningSelectParticipantForm>;

    @Input() set hearing(hearing: HearingModel) {
        const mappedParticipants = hearing.participants
            .filter(x => x.email)
            .map(
                participant =>
                    ({
                        displayName: participant.display_name,
                        externalReferenceId: participant.externalReferenceId,
                        isNewlyAdded: participant.id === null || participant.id === undefined
                    } as GenericParticipantsModel)
            );

        const mappedEndpoints = hearing.endpoints.map(
            endpoint =>
                ({
                    displayName: endpoint.displayName,
                    externalReferenceId: endpoint.externalReferenceId,
                    isNewlyAdded: endpoint.id === null || endpoint.id === undefined
                } as GenericParticipantsModel)
        );
        this.isEditMode = !!hearing.hearing_id;
        this.allParticipants = [...mappedParticipants, ...mappedEndpoints].filter(participant =>
            this.includeParticipantInScreeningOptions(participant)
        );
        this.createForm();
        this.cdRef.detectChanges();
    }

    createForm() {
        this.form = this.formBuilder.group<ScreeningSelectParticipantForm>({
            displayName: new FormControl(null),
            measureType: new FormControl('Specific')
        });

        this.form.controls.displayName.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
            if (value === 'null') {
                this.availableProtectParticipantFromList = [];
                this.displayMeasureType = false;
                return;
            }
            if (value) {
                this.onParticipantSelected(value);
                this.onMeasureTypeSelected('Specific', value);
            }
        });
    }

    onMeasureTypeSelected(measureType: ScreeningType, participantDisplayName: string) {
        this.displayProtectFromList = measureType === 'Specific';
        if (measureType === 'Specific') {
            const participantsModel = this.allParticipants.find(participant => participant.displayName === participantDisplayName);
            this.initialiseScreening(participantsModel.displayName);
            this.selectedProtectParticipantFromList = [];
        }
    }

    onParticipantSelected(displayName: string): void {
        this.displayMeasureType = false;
        this.initialiseScreening(displayName);
        this.selectedProtectParticipantFromList = [];
    }

    initialiseScreening(displayName: string) {
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

    /// VIH-11046: due to the way updating a hearing orchestrates updating participants and endpoints in two separate requests to the booking-api,
    // we need to restrict the ability to add a screening link between a newly added participant and newly added endpoints else the id won't be available to link the two.
    // The user needs to save booking first then add a screening option.
    // this can be removed in future if the way we change how updating hearing participants works.
    private includeParticipantInScreeningOptions(participant: GenericParticipantsModel): boolean {
        if (this.isEditMode && participant.isNewlyAdded) {
            this.newParticipantRemovedFromOptions = true;
            return false;
        }
        return true;
    }
}

interface ScreeningSelectParticipantForm {
    displayName: FormControl<string>;
    measureType: FormControl<ScreeningType>;
}

interface GenericParticipantsModel {
    displayName: string;
    externalReferenceId: string;
    isNewlyAdded: boolean;
}
