import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Constants } from '../../common/constants';
import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import {
  HearingVenueResponse,
  HearingTypeResponse,
} from '../../services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})

export class SummaryComponent implements OnInit, CanDeactiveComponent {

  constants = Constants;
  hearing: HearingModel;
  attemptingCancellation: boolean;
  canNavigate = true;
  hearingForm: FormGroup;
  failedSubmission: boolean;
  bookingsSaving = false;

  caseNumber: string;
  caseName: string;
  caseHearingType: string;
  hearingDate: Date;
  courtRoomAddress: string;
  hearingDuration: string;
  otherInformation: string;
  errors: any;

  selectedHearingType: HearingTypeResponse[];
  saveFailed: boolean;

  showConfirmationRemoveParticipant = false;
  selectedParticipantEmail: string;
  removerFullName: string;

  @ViewChild(ParticipantsListComponent)
  participantsListComponent: ParticipantsListComponent;

  constructor(private hearingService: VideoHearingsService, private router: Router, private referenceDataService: ReferenceDataService) {
    this.attemptingCancellation = false;
    this.saveFailed = false;
  }

  ngOnInit() {
    this.checkForExistingRequest();
    this.retrieveHearingSummary();
    if (this.participantsListComponent) {
      this.participantsListComponent.selectedParticipantToRemove.subscribe((participantEmail) => {
        this.selectedParticipantEmail = participantEmail;
        this.confirmRemoveParticipant();
      });
    }
  }

  private checkForExistingRequest() {
    this.hearing = this.hearingService.getCurrentRequest();
  }

  private confirmRemoveParticipant() {
    const participant = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
    this.removerFullName = participant ? `${participant.title} ${participant.first_name} ${participant.last_name}` : '';
    this.showConfirmationRemoveParticipant = true;
  }

  handleContinueRemove() {
    this.showConfirmationRemoveParticipant = false;
    this.removeParticipant();
  }

  handleCancelRemove() {
    this.showConfirmationRemoveParticipant = false;
  }

  removeParticipant() {
    const indexOfParticipant = this.hearing.participants
      .findIndex(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
    if (indexOfParticipant > -1) {
      this.hearing.participants.splice(indexOfParticipant, 1);
    }
    this.hearingService.updateHearingRequest(this.hearing);
  }

  private retrieveHearingSummary() {
    this.caseNumber = this.hearing.cases[0].number;
    this.caseName = this.hearing.cases[0].name;
    this.getCaseHearingTypeName(this.hearing.hearing_type_id);
    this.hearingDate = this.hearing.scheduled_date_time;
    this.getCourtRoomAndAddress(this.hearing.hearing_venue_id);
    this.hearingDuration = this.getHearingDuration(this.hearing.scheduled_duration);
    this.otherInformation = this.hearing.other_information;
  }

  private getCaseHearingTypeName(hearing_type_id: number): void {
    this.hearingService.getHearingTypes()
      .subscribe(
        (data: HearingTypeResponse[]) => {
          const selectedHearingType = data.filter(h => h.id === hearing_type_id);
          this.caseHearingType = selectedHearingType[0].name;
        },
        error => console.error(error)
      );
  }

  private getCourtRoomAndAddress(venueId: number): void {
    this.referenceDataService.getCourts()
      .subscribe(
        (data: HearingVenueResponse[]) => {
          const selectedCourt = data.filter(c => c.id === venueId);
          this.courtRoomAddress = `${selectedCourt[0].name} ${this.hearing.court_room}`;
        },
        error => console.error(error)
      );
  }

  private getHearingDuration(duration: number): string {
    return 'listed for ' + (duration === null ? 0 : duration) + ' minutes';
  }

  continueBooking() {
    this.attemptingCancellation = false;
  }

  confirmCancelBooking() {
    this.attemptingCancellation = true;
  }

  cancelBooking() {
    this.attemptingCancellation = false;
    this.hearingService.cancelRequest();
    this.router.navigate(['/dashboard']);
  }

  hasChanges(): Observable<boolean> | boolean {
    return true;
  }

  bookHearing(): void {
    this.bookingsSaving = true;
    this.hearingService.saveHearing(this.hearing)
      .subscribe(
        (data: number) => {
          this.hearingService.cancelRequest();
          this.router.navigate(['/booking-confirmation']);
        },
        error => {
          console.error(error);
          this.saveFailed = true;
          this.errors = error;
        }
      );

    if (this.errors) {
      this.saveFailed = true;
    }
  }
}
