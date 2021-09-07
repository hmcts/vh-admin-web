import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { AddParticipantBaseDirective } from 'src/app/booking/add-participant-base/add-participant-base.component';
import { Router } from '@angular/router';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Subscription } from 'rxjs';
import { Constants } from 'src/app/common/constants';

@Component({
    selector: 'app-add-staff-member',
    templateUrl: './add-staff-member.component.html',
    styleUrls: ['./add-staff-member.component.css']
})
export class AddStaffMemberComponent extends AddParticipantBaseDirective implements OnInit, OnDestroy {
    @Input() staffMemberLocator: string;
    @Input() isShowErrorSummary: boolean;
    @Output() staffMember = new EventEmitter<ParticipantModel>();
    @Output() isStaffMemberValid = new EventEmitter<boolean>();

    $subscriptions: Subscription[] = [];

    isSubscribedToEmailChanges = false;

    constructor(
        protected bookingService: BookingService,
        protected router: Router,
        protected videoHearingService: VideoHearingsService,
        protected logger: Logger
    ) {
        super(bookingService, router, videoHearingService, logger);
    }

    ngOnInit(): void {
        this.checkForExistingRequest();
        this.initialiseForm();

        this.setupStaffMemberValidityEmissionOnFormValueChange();
        this.setupStaffMemberEmissionWhenValid();
    }

    ngOnDestroy(): void {
        this.$subscriptions.forEach(subscription => {
            if (subscription) {
                subscription.unsubscribe();
            }
        });
    }

    private checkForExistingRequest() {
        this.hearing = this.videoHearingService.getCurrentRequest();
    }

    initialiseForm() {
        super.initialiseForm();
        this.form.removeControl('interpreterFor');

        this.role.setValue(Constants.HearingRoles.StaffMember);

        const existingStaffMember = this.hearing?.participants.find(x => x.hearing_role_name === Constants.HearingRoles.StaffMember);

        if (existingStaffMember) {
            this.displayName.setValue(existingStaffMember.display_name);
            this.firstName.setValue(existingStaffMember.first_name);
            this.lastName.setValue(existingStaffMember.last_name);
            this.phone.setValue(existingStaffMember.phone);
            this.email.setValue(existingStaffMember.email);

            this.isStaffMemberValid.emit(true);
            this.staffMember.emit(existingStaffMember);
        }
    }

    setupStaffMemberValidityEmissionOnFormValueChange(): void {
        const formValueChangeSubscription = this.form.valueChanges.subscribe(() => {
            if (!this.isSubscribedToEmailChanges && this.searchEmail) {
                this.isSubscribedToEmailChanges = true;

                const emailChangeSubscription = this.searchEmail.emailChanged.subscribe(email => this.email.setValue(email));

                this.$subscriptions.push(emailChangeSubscription);
            }

            this.isStaffMemberValid.emit(this.form.valid);
        });

        this.$subscriptions.push(formValueChangeSubscription);
    }

    setupStaffMemberEmissionWhenValid(): void {
        const isStaffMemberValidSubscription = this.isStaffMemberValid.subscribe(isValid => {
            if (!isValid) {
                return;
            }

            const staffMember = this.mapFormToStaffMember();
            this.staffMember.emit(staffMember);
        });

        this.$subscriptions.push(isStaffMemberValidSubscription);
    }

    private mapFormToStaffMember() {
        return new ParticipantModel({
            display_name: this.displayName.value,
            first_name: this.firstName.value,
            last_name: this.lastName.value,
            phone: this.phone.value,
            email: this.email.value,
            case_role_name: this.role.value,
            hearing_role_name: this.role.value,
            user_role_name: this.role.value
        });
    }
}
