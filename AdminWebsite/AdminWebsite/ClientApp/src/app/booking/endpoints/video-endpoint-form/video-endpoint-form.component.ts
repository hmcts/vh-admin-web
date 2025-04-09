import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { EndpointLink, VideoAccessPointDto } from '../models/video-access-point.model';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Constants } from 'src/app/common/constants';
import { InterpreterSelectedDto } from '../../interpreter-form/interpreter-selected.model';
import { InterpreterFormComponent } from '../../interpreter-form/interpreter-form.component';
import { FeatureFlags } from 'src/app/services/launch-darkly.service';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Component({
    selector: 'app-video-endpoint-form',
    templateUrl: './video-endpoint-form.component.html',
    standalone: false
})
export class VideoEndpointFormComponent {
    errorMessages = Constants.Error;
    featureFlags = FeatureFlags;

    availableRepresentatives: VHParticipant[] = [];
    availableIntermediaries: VHParticipant[] = [];

    constants = Constants;

    form: FormGroup<VideoEndpointForm>;
    saveButtonText = '';
    videoEndpoint: VideoAccessPointDto;
    interpreterSelection: InterpreterSelectedDto;
    private editMode = false;

    @Input() set existingVideoEndpoint(value: VideoAccessPointDto) {
        if (value) {
            this.videoEndpoint = value;
            this.populateFormForExistingEndpoint();
            this.editMode = true;
            this.saveButtonText = 'Update Access Point';
        } else {
            this.editMode = false;
            this.saveButtonText = 'Save Access Point';
        }
    }

    @Input() existingVideoEndpoints: VideoAccessPointDto[] = [];

    @Input() set participants(value: VHParticipant[]) {
        this._participants = value;
        this.availableIntermediaries = this._participants.filter(p => this.filterInts(p) && p.email);
        this.availableRepresentatives = this._participants.filter(p => this.filterReps(p) && p.email);
    }
    @Output() endpointAdded = new EventEmitter<VideoAccessPointDto>();
    @Output() endpointUpdated = new EventEmitter<{ original: VideoAccessPointDto; updated: VideoAccessPointDto }>();

    @ViewChild('interpreterForm') interpreterForm: InterpreterFormComponent;

    private _participants: VHParticipant[];

    constructor(private readonly formBuilder: FormBuilder) {
        this.createForm();
    }
    createForm() {
        this.form = this.formBuilder.group<VideoEndpointForm>({
            displayName: this.formBuilder.control(null, [
                Validators.required,
                blankSpaceValidator,
                Validators.pattern(this.constants.EndpointDisplayNamePattern),
                this.uniqueDisplayNameValidator()
            ]),
            representative: this.formBuilder.control(null, [Validators.maxLength(255)]),
            intermediary: this.formBuilder.control(null, [Validators.maxLength(255)])
        });
    }

    onSubmit() {
        this.form.markAllAsTouched();

        const includeInterpreter = this.interpreterForm ?? false;
        this.interpreterForm?.forceValidation();
        if (!this.form.valid || (includeInterpreter && !this.interpreterForm?.form.valid)) {
            return;
        }
        const participantsLinked = this.extractLinkedParticipants();

        const dto: VideoAccessPointDto = {
            ...this.videoEndpoint,
            displayName: this.form.value.displayName,
            participantsLinked: participantsLinked,
            interpretationLanguage: this.interpreterSelection,
            screening: this.videoEndpoint?.screening,
            externalReferenceId: this.videoEndpoint?.externalReferenceId
        };
        if (this.editMode) {
            this.endpointUpdated.emit({ original: this.videoEndpoint, updated: dto });
        } else {
            this.endpointAdded.emit(dto);
        }

        this.form.reset({
            displayName: null,
            representative: null,
            intermediary: null
        });
        this.interpreterForm?.resetForm();
    }

    onInterpreterLanguageSelected($event: InterpreterSelectedDto) {
        this.interpreterSelection = $event;
        if (!$event.interpreterRequired) {
            this.interpreterSelection = null;
        }
    }

    uniqueDisplayNameValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            const isUnique = !this.existingVideoEndpoints.some(endpoint => endpoint.displayName === control.value);
            // if this.videoEndpoint is set, we are in edit mode, so we need to check if the new name is the same as the old name
            if (this.videoEndpoint) {
                return isUnique || control.value === this.videoEndpoint.displayName
                    ? null
                    : { displayNameExists: { value: control.value } };
            }
            return isUnique ? null : { displayNameExists: { value: control.value } };
        };
    }

    private populateFormForExistingEndpoint() {
        const linkedParticipants = this.videoEndpoint.participantsLinked || [];
        const representative =
            linkedParticipants.find(lp => this._participants.some(ar => this.filterReps(ar) && ar.email === lp.email))?.email ?? null;
        const intermediary =
            linkedParticipants.find(lp => this._participants.some(ai => this.filterInts(ai) && ai.email === lp.email))?.email ?? null;
        this.form.setValue(
            {
                displayName: this.videoEndpoint.displayName,
                representative: representative,
                intermediary: intermediary
            },
            { emitEvent: false, onlySelf: true }
        );
        this.form.markAllAsTouched();
        this.interpreterForm?.prepopulateForm(this.videoEndpoint.interpretationLanguage);
    }

    private extractLinkedParticipants() {
        const representative = this.extractRep();
        const intermediary = this.extractIntermediary();
        return !representative && !intermediary ? null : [representative, intermediary].filter(p => p !== null);
    }

    private extractIntermediary() {
        let inter: EndpointLink = null;
        if (this.form.value.intermediary && this.form.value.intermediary !== 'null') {
            const intermediary = this.availableIntermediaries.find(p => p.email === this.form.value.intermediary);
            inter = {
                email: intermediary.email,
                displayName: intermediary.displayName
            };
        }
        return inter;
    }

    private extractRep() {
        let rep: EndpointLink = null;
        if (this.form.value.representative && this.form.value.representative !== 'null') {
            const representative = this.availableRepresentatives.find(p => p.email === this.form.value.representative);
            rep = {
                email: representative.email,
                displayName: representative.displayName
            };
        }
        return rep;
    }

    private filterInts = (p: VHParticipant) => p.hearingRoleCode === this.constants.HearingRoleCodes.Intermediary;

    private filterReps = (p: VHParticipant) =>
        p.userRoleName === this.constants.UserRoles.Representative && p.hearingRoleCode !== this.constants.HearingRoleCodes.Intermediary;
}

function blankSpaceValidator(control: AbstractControl): { [key: string]: any } | null {
    const displayNameText: string = control.value;
    if (displayNameText?.replace(/\s/g, '').length) {
        return null;
    } else {
        return { blankSpaceValidator: true };
    }
}

interface VideoEndpointForm {
    displayName: FormControl<string | null>;
    representative: FormControl<string | null>;
    intermediary: FormControl<string | null>;
}
