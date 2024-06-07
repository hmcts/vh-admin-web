import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { EndpointLink, VideoAccessPointDto } from '../models/video-access-point.model';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Constants } from 'src/app/common/constants';
import { HearingRoleCodes } from 'src/app/common/model/hearing-roles.model';

@Component({
    selector: 'app-video-endpoint-form',
    templateUrl: './video-endpoint-form.component.html'
})
export class VideoEndpointFormComponent {
    errorMessages = Constants.Error;

    availableIntermediaries: ParticipantModel[] = [];
    availableRepresentatives: ParticipantModel[] = [];
    constants = Constants;

    form: FormGroup<VideoEndpointForm>;
    saveButtonText = 'Save';
    videoEndpoint: VideoAccessPointDto;
    private editMode = false;

    @Input() set existingVideoEndpoint(value: VideoAccessPointDto) {
        if (value) {
            this.videoEndpoint = value;
            this.form.setValue(
                {
                    displayName: value.displayName,
                    linkedRepresentative: value.defenceAdvocate?.email ?? null
                },
                { emitEvent: false, onlySelf: true }
            );
            this.editMode = true;
            this.form.markAllAsTouched();
        } else {
            this.editMode = false;
        }
    }

    @Input() existingVideoEndpoints: VideoAccessPointDto[] = [];

    @Input() set participants(value: ParticipantModel[]) {
        this._participants = value;

        this.availableRepresentatives = this._participants.filter(
            p => p.user_role_name === this.constants.Representative && p.hearing_role_code !== HearingRoleCodes.Intermediary && p.email
        );
        this.availableIntermediaries = this._participants.filter(p => p.hearing_role_code === HearingRoleCodes.Intermediary && p.email);
    }
    @Output() endpointAdded = new EventEmitter<VideoAccessPointDto>();
    @Output() endpointUpdated = new EventEmitter<{ original: VideoAccessPointDto; updated: VideoAccessPointDto }>();

    private _participants: ParticipantModel[];

    constructor(private formBuilder: FormBuilder) {
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
            linkedRepresentative: this.formBuilder.control(null, [Validators.maxLength(255)])
        });
    }

    onSubmit() {
        this.form.markAllAsTouched();
        if (!this.form.valid) {
            return;
        }
        let defenceAdvocate: EndpointLink = null;
        if (this.form.value.linkedRepresentative) {
            const representative = this.availableRepresentatives.find(p => p.email === this.form.value.linkedRepresentative);
            defenceAdvocate = {
                email: representative.email,
                displayName: representative.display_name
            };
        }
        const dto: VideoAccessPointDto = {
            ...this.videoEndpoint,
            displayName: this.form.value.displayName,
            defenceAdvocate
        };
        if (this.editMode) {
            this.endpointUpdated.emit({ original: this.videoEndpoint, updated: dto });
        } else {
            this.endpointAdded.emit(dto);
        }

        this.form.reset({
            displayName: null,
            linkedRepresentative: null
        });
    }

    uniqueDisplayNameValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            const isUnique = !this.existingVideoEndpoints.some(
                endpoint => endpoint.displayName === control.value && endpoint.id !== this.videoEndpoint.id
            );
            return isUnique ? null : { displayNameExists: { value: control.value } };
        };
    }
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
    linkedRepresentative: FormControl<string | null>;
}
