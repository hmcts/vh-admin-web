import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { SanitizeInputText } from 'src/app/common/formatters/sanitize-input-text';
import { DefenceAdvocateModel } from 'src/app/common/model/defence-advocate.model';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';

@Component({
    selector: 'app-endpoints',
    templateUrl: './endpoints.component.html'
})
export class EndpointsComponent extends BookingBaseComponent implements OnInit, OnDestroy {
    canNavigate = true;
    constants = Constants;
    hearing: HearingModel;
    $subscriptions: Subscription[] = [];
    attemptingCancellation = false;
    attemptingDiscardChanges = false;
    failedValidation: boolean;
    newEndpoints: EndpointModel[] = [];
    availableDefenceAdvocates: DefenceAdvocateModel[] = [];
    participants: ParticipantModel[] = [];
    select: any[] = [];
    duplicateDa = false;

    constructor(
        private fb: FormBuilder,
        protected bookingService: BookingService,
        protected router: Router,
        protected videoHearingService: VideoHearingsService,
        protected logger: Logger
    ) {
        super(bookingService, router, videoHearingService, logger);
    }

    ngOnInit(): void {
        this.failedValidation = false;
        this.checkForExistingRequest();
        this.initialiseForm();
        super.ngOnInit();
    }

    ngOnDestroy(): void {
        this.bookingService.removeEditMode();
        this.$subscriptions.forEach(subcription => {
            if (subcription) {
                subcription.unsubscribe();
            }
        });
    }

    get endpoints(): FormArray {
        return <FormArray>this.form.get('endpoints');
    }

    addEndpoint(): void {
        this.duplicateDa = false;
        if (!this.hasDuplicateDisplayName(this.newEndpoints)) {
            this.failedValidation = false;
            this.logger.debug(`${this.loggerPrefix} Updating list of endpoints.`);
            this.endpoints.push(this.addEndpointsFormGroup());
        } else {
            this.failedValidation = true;
            this.logger.warn(`${this.loggerPrefix} Cannot add an endpoint with the same display name.`);
        }
    }

    saveEndpoints(): void {
        this.logger.debug(`${this.loggerPrefix} Attempting to save endpoints to booking.`);
        this.duplicateDa = false;
        const newEndpointsArray: EndpointModel[] = [];
        for (const control of this.endpoints.controls) {
            const endpointModel = new EndpointModel();
            if (control.value.displayName.trim() !== '') {
                const displayNameText = SanitizeInputText(control.value.displayName);
                endpointModel.displayName = displayNameText;
                endpointModel.id = control.value.id;
                endpointModel.defenceAdvocate = control.value.defenceAdvocate !== this.constants.None ? control.value.defenceAdvocate : '';
                newEndpointsArray.push(endpointModel);
            }
        }

        if (!this.hasDuplicateDisplayName(newEndpointsArray)) {
            this.failedValidation = false;
            this.hearing.endpoints = newEndpointsArray;
            this.videoHearingService.updateHearingRequest(this.hearing);
            this.logger.debug(`${this.loggerPrefix} Updated hearing request`, { hearing: this.hearing?.hearing_id, payload: this.hearing });

            if (this.editMode) {
                this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary.`);
                this.router.navigate([PageUrls.Summary]);
            } else {
                this.logger.debug(`${this.loggerPrefix} Proceeding to other information.`);
                this.router.navigate([PageUrls.OtherInformation]);
            }
        } else {
            this.failedValidation = true;
            this.logger.warn(`${this.loggerPrefix} Cannot add an endpoint with the same display name`);
        }
    }

    removeEndpoint(rowIndex: number): void {
        this.logger.debug(`${this.loggerPrefix} Removing endpoint at index position ${rowIndex}.`);
        this.endpoints.removeAt(rowIndex);
    }

    cancelBooking(): void {
        this.logger.debug(`${this.loggerPrefix} Attempting to cancel booking.`);
        if (this.editMode) {
            if (this.form.dirty || this.form.touched) {
                this.logger.debug(`${this.loggerPrefix} In edit mode. Changes found. Confirm if changes should be discarded.`);
                this.attemptingDiscardChanges = true;
            } else {
                this.logger.debug(`${this.loggerPrefix} In edit mode. No changes. Returning to summary.`);
                this.router.navigate([PageUrls.Summary]);
            }
        } else {
            this.logger.debug(`${this.loggerPrefix} New booking. Changes found. Confirm if changes should be discarded.`);
            this.attemptingCancellation = true;
        }
    }

    continueBooking() {
        this.logger.debug(`${this.loggerPrefix} Rejected cancellation. Continuing with booking.`);
        this.attemptingCancellation = false;
        this.attemptingDiscardChanges = false;
    }

    cancelEndpoints() {
        this.logger.debug(`${this.loggerPrefix} Cancelling booking and returning to dashboard.`);
        this.attemptingCancellation = false;
        this.form.reset();
        this.videoHearingService.cancelRequest();
        this.router.navigate([PageUrls.Dashboard]);
    }

    cancelChanges() {
        this.logger.debug(`${this.loggerPrefix} Resetting changes. Returning to summary.`);
        this.attemptingDiscardChanges = false;
        this.form.reset();
        this.navigateToSummary();
    }

    private checkForExistingRequest(): void {
        this.hearing = this.videoHearingService.getCurrentRequest();
        this.participants = this.hearing.participants.filter(
            p => p.hearing_role_name === this.constants.DefenceAdvocate || p.hearing_role_name === this.constants.RespondentAdvocate
        );
    }
    private initialiseForm(): void {
        this.availableDefenceAdvocates = this.populateDefenceAdvocates();
        this.form = this.fb.group({
            endpoints: this.fb.array([this.addEndpointsFormGroup()])
        });
        if (this.hearing.endpoints.length > 0) {
            this.newEndpoints = this.hearing.endpoints;
            this.form.setControl('endpoints', this.setExistingEndpoints(this.newEndpoints));
        }
        this.$subscriptions.push(
            this.form.get('endpoints').valueChanges.subscribe(ep => {
                this.newEndpoints = ep;
            })
        );
    }
    private setExistingEndpoints(endpoints: EndpointModel[]): FormArray {
        const formArray = new FormArray([]);
        endpoints.forEach(e => {
            formArray.push(
                this.fb.group({
                    id: e.id,
                    displayName: e.displayName,
                    defenceAdvocateId: e.defenceAdvocate,
                    defenceAdvocate: e.defenceAdvocate === undefined ? 'None' : this.getUsernameFromId(e.defenceAdvocate)
                })
            );
        });
        return formArray;
    }
    private populateDefenceAdvocates(): DefenceAdvocateModel[] {
        let defenceAdvocates: Array<DefenceAdvocateModel> = [];
        if (this.hearing.participants && this.hearing.participants.length > 0) {
            defenceAdvocates = this.participants.map(x => this.mapParticipantsToDefenceAdvocateModel(x));
        }
        const defenceAdvocateModel = Object.assign(new DefenceAdvocateModel(), {
            id: null,
            username: this.constants.None,
            displayName: this.constants.None,
            isSelected: null
        });
        defenceAdvocates.unshift(defenceAdvocateModel);
        return defenceAdvocates;
    }
    mapParticipantsToDefenceAdvocateModel(participant: ParticipantModel): DefenceAdvocateModel {
        const defenceAdvocateModel = Object.assign(new DefenceAdvocateModel(), {
            id: participant.id,
            username: participant.username,
            displayName: participant.display_name,
            isSelected: null
        });
        return defenceAdvocateModel;
    }
    getUsernameFromId(participantId: string): string {
        const defAdv = this.hearing.participants.find(p => p.id === participantId);
        if (defAdv) {
            return defAdv.username;
        }
        return participantId;
    }
    private addEndpointsFormGroup(): FormGroup {
        return this.fb.group({
            displayName: ['', [blankSpaceValidator]],
            defenceAdvocate: ['None'],
            id: [],
            defenceAdvocateId: []
        });
    }

    private hasDuplicateDisplayName(endpoints: EndpointModel[]): boolean {
        const listOfDisplayNames = endpoints.map(function (item) {
            return item.displayName;
        });
        const duplicateDisplayName = listOfDisplayNames.some(function (item, position) {
            return listOfDisplayNames.indexOf(item) !== position;
        });
        if (duplicateDisplayName) {
            this.duplicateDa = true;
        }
        return duplicateDisplayName;
    }
}

function blankSpaceValidator(control: AbstractControl): { [key: string]: any } | null {
    const displayNameText: string = control.value;
    if (displayNameText !== null && displayNameText.replace(/\s/g, '').length) {
        return null;
    } else {
        return { blankSpaceValidator: true };
    }
}
