import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Constants } from '../../common/constants';
import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import { HearingVenueResponse, HearingTypeResponse } from '../../services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantsListComponent } from '../participants-list/participants-list.component';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { PageUrls } from '../../shared/page-url.constants';
import { HearingDetailsResponse } from '../../services/clients/api-client';
import { BookingService } from '../../services/booking.service';
import { RemovePopupComponent } from '../../popups/remove-popup/remove-popup.component';
import { FormatShortDuration } from '../../common/formatters/format-short-duration';

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
  showConfirmationRemoveParticipant = false;
  selectedParticipantEmail: string;
  removerFullName: string;
  showWaitSaving = false;
  showErrorSaving: boolean;
  private newHearingSessionKey = 'newHearingId';
  isExistingBooking = false;

  @ViewChild(ParticipantsListComponent)
  participantsListComponent: ParticipantsListComponent;

  @ViewChild(RemovePopupComponent)
  removePopupComponent: RemovePopupComponent;

  constructor(private hearingService: VideoHearingsService,
    private router: Router,
    private referenceDataService: ReferenceDataService,
    private bookingService: BookingService
  ) {
    this.attemptingCancellation = false;
    this.showErrorSaving = false;
  }

  ngOnInit() {
    this.checkForExistingRequest();
    this.retrieveHearingSummary();
    if (this.participantsListComponent) {
      this.participantsListComponent.isEditMode = this.isExistingBooking;
      this.participantsListComponent.selectedParticipantToRemove.subscribe((participantEmail) => {
        this.selectedParticipantEmail = participantEmail;
        this.confirmRemoveParticipant();
      });
    }
  }

  private checkForExistingRequest() {
    this.hearing = this.hearingService.getCurrentRequest();
    this.isExistingBooking = this.hearing.hearing_id && this.hearing.hearing_id.length > 0;
  }

  private confirmRemoveParticipant() {
    const participant = this.hearing.participants.find(x => x.email.toLowerCase() === this.selectedParticipantEmail.toLowerCase());
    const filteredParticipants = this.hearing.participants.filter(x => !x.is_judge);
    const isNotLast = filteredParticipants && filteredParticipants.length > 1;
    this.removerFullName = participant ? `${participant.title} ${participant.first_name} ${participant.last_name}` : '';
    this.showConfirmationRemoveParticipant = true;
    setTimeout(() => {
      this.removePopupComponent.isLastParticipant = !isNotLast;
    }, 500);
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
      this.hearingService.updateHearingRequest(this.hearing);
      this.bookingService.removeParticipantEmail();
      this.isLastParticipanRemoved();
    }
  }
  isLastParticipanRemoved() {
    const filteredParticipants = this.hearing.participants.filter(x => !x.is_judge);
    if (!filteredParticipants || filteredParticipants.length === 0) {
      // the last participant was removed, go to 'add participant' screen
      this.router.navigate([PageUrls.AddParticipants]);
    }
  }

  private retrieveHearingSummary() {
    this.caseNumber = this.hearing.cases.length > 0 ? this.hearing.cases[0].number : '';
    this.caseName = this.hearing.cases.length > 0 ? this.hearing.cases[0].name : '';
    this.caseHearingType = this.hearing.hearing_type_name;
    this.hearingDate = this.hearing.scheduled_date_time;
    this.hearingDuration = `listed for ${FormatShortDuration(this.hearing.scheduled_duration)}`;
    const courtRoomText = this.hearing.court_room ? ', ' + this.hearing.court_room : '';
    this.courtRoomAddress = `${this.hearing.court_name}${courtRoomText}`;
    this.otherInformation = this.hearing.other_information;
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
    if (this.isExistingBooking) {
      this.router.navigate([PageUrls.BookingDetails]);
    } else {
      this.router.navigate([PageUrls.Dashboard]);
    }
  }

  hasChanges(): Observable<boolean> | boolean {
    return true;
  }

  bookHearing(): void {
    this.bookingsSaving = true;
    this.showWaitSaving = true;
    this.showErrorSaving = false;
    if (this.hearing.hearing_id && this.hearing.hearing_id.length > 0) {
      this.updateHearing();
    } else {
      this.hearingService.saveHearing(this.hearing)
        .subscribe(
          (hearingDetailsResponse: HearingDetailsResponse) => {
            sessionStorage.setItem(this.newHearingSessionKey, hearingDetailsResponse.id);
            this.hearingService.cancelRequest();
            this.showWaitSaving = false;
            this.router.navigate([PageUrls.BookingConfirmation]);
          },
          error => {
            this.setError(error);
          }
        );
    }
  }

  updateHearing() {
    this.hearingService.updateHearing(this.hearing)
      .subscribe((hearingDetailsResponse: HearingDetailsResponse) => {
        this.showWaitSaving = false;
        this.router.navigate([PageUrls.BookingDetails]);
      }, error => {
        this.setError(error);
      });
  }

  private setError(error) {
    this.showWaitSaving = false;
    this.showErrorSaving = true;
    this.errors = error;
  }

  cancel(): void {
    this.showErrorSaving = false;
  }

  tryAgain(): void {
    this.showErrorSaving = true;
    this.bookHearing();
  }
}
