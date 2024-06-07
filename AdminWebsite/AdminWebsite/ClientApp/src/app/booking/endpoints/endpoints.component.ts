import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { Constants } from 'src/app/common/constants';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { BookingBaseComponentDirective as BookingBaseComponent } from '../booking-base/booking-base.component';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VideoAccessPointDto } from './models/video-access-point.model';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'app-endpoints',
    templateUrl: './endpoints.component.html'
})
export class EndpointsComponent extends BookingBaseComponent implements OnInit, OnDestroy {
    canNavigate = true;
    constants = Constants;
    hearing: HearingModel;

    attemptingCancellation = false;
    attemptingDiscardChanges = false;

    participants: ParticipantModel[] = [];

    multiDayBookingEnhancementsEnabled: boolean;
    videoEndpoints: VideoAccessPointDto[];
    videoEndpointToEdit: VideoAccessPointDto;

    constructor(
        protected bookingService: BookingService,
        protected router: Router,
        protected videoHearingService: VideoHearingsService,
        protected logger: Logger,
        private featureService: LaunchDarklyService
    ) {
        super(bookingService, router, videoHearingService, logger);
    }

    get isHearingAboutToStart(): boolean {
        return this.videoHearingService.isHearingAboutToStart();
    }

    ngOnInit(): void {
        this.form = new FormGroup({}); // need to initialise form to avoid errors
        this.checkForExistingRequest();
        this.featureService
            .getFlag<boolean>(FeatureFlags.multiDayBookingEnhancements)
            .pipe(first())
            .subscribe(result => {
                this.multiDayBookingEnhancementsEnabled = result;
            });
        super.ngOnInit();
    }

    ngOnDestroy(): void {
        this.bookingService.removeEditMode();
    }

    saveEndpoints(): void {
        this.logger.debug(`${this.loggerPrefix} Attempting to save endpoints to booking.`);

        const newEndpointsArray: EndpointModel[] = [];
        for (const vapDto of this.videoEndpoints) {
            const endpointModel = new EndpointModel();
            endpointModel.id = vapDto.id;
            endpointModel.displayName = vapDto.displayName;
            endpointModel.defenceAdvocate = vapDto.defenceAdvocate?.email;
            newEndpointsArray.push(endpointModel);
        }

        this.hearing.endpoints = newEndpointsArray;
        this.videoHearingService.updateHearingRequest(this.hearing);
        this.logger.debug(`${this.loggerPrefix} Updated hearing request`, { hearing: this.hearing?.hearing_id, payload: this.hearing });

        let canEditOtherInformation = true;
        const booking = this.videoHearingService.getCurrentRequest();
        if (booking.isMultiDay && this.multiDayBookingEnhancementsEnabled) {
            canEditOtherInformation = false;
        }

        if (this.editMode || !canEditOtherInformation) {
            this.logger.debug(`${this.loggerPrefix} In edit mode. Returning to summary.`);
            this.router.navigate([PageUrls.Summary]);
        } else {
            this.logger.debug(`${this.loggerPrefix} Proceeding to other information.`);
            this.router.navigate([PageUrls.OtherInformation]);
        }
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

    onEndpointAdded($event: VideoAccessPointDto) {
        // Check if the videoEndpoints array already contains an endpoint with the same displayName
        const existingEndpoint = this.videoEndpoints.find(endpoint => endpoint.displayName === $event.displayName);

        // If no such endpoint exists, push the new endpoint to the videoEndpoints array
        if (!existingEndpoint) {
            this.videoEndpoints.push($event);
            this.videoHearingService.setBookingHasChanged(true);
        }
    }

    onEndpointUpdated($event: { original: VideoAccessPointDto; updated: VideoAccessPointDto }) {
        // Find the index of the original endpoint in the videoEndpoints array
        const index = this.videoEndpoints.findIndex(endpoint => endpoint.displayName === $event.original.displayName);

        // If the original endpoint is found, replace it with the updated endpoint
        if (index !== -1) {
            this.videoEndpoints[index] = $event.updated;
            this.videoEndpointToEdit = null;
            this.videoHearingService.setBookingHasChanged(true);
        }
    }

    onEndpointSelectedForDeletion(existingEndpoint: VideoAccessPointDto) {
        this.videoEndpoints = this.videoEndpoints.filter(endpoint => endpoint.displayName !== existingEndpoint.displayName);
        this.videoHearingService.setBookingHasChanged(true);
    }

    onEndpointSelectedForEdit(existingEndpoint: VideoAccessPointDto) {
        this.videoEndpointToEdit = existingEndpoint;
    }

    private checkForExistingRequest(): void {
        this.hearing = this.videoHearingService.getCurrentRequest();
        this.participants = this.hearing.participants.filter(p => p.user_role_name === this.constants.Representative);
        this.videoEndpoints = this.hearing.endpoints.map(e => {
            const defenceAdvocate = this.participants.find(p => p.email === e.defenceAdvocate);
            return {
                id: e.id,
                displayName: e.displayName,
                defenceAdvocate: defenceAdvocate
                    ? {
                          displayName: defenceAdvocate?.display_name,
                          email: defenceAdvocate?.email
                      }
                    : null
            };
        });
    }
}
