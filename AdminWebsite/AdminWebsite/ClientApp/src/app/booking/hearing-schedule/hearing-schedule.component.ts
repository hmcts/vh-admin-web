import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { CanDeactiveComponent } from '../../common/guards/changes.guard';
import { CourtResponse } from '../../services/clients/api-client';
import { HearingModel } from '../../common/model/hearing.model';
import { ReferenceDataService } from '../../services/reference-data.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingBaseComponent } from '../booking-base/booking-base.component';
import { BookingService } from '../../services/booking.service';
import { ErrorService } from 'src/app/services/error.service';

@Component({
  selector: 'app-hearing-schedule',
  templateUrl: './hearing-schedule.component.html',
  styleUrls: ['./hearing-schedule.component.css']
})
export class HearingScheduleComponent extends BookingBaseComponent implements OnInit, CanDeactiveComponent {

  hearing: HearingModel;
  availableCourts: CourtResponse[];
  schedulingForm: FormGroup;
  failedSubmission: boolean;
  attemptingCancellation: boolean;
  hasSaved: boolean;
  today = new Date();
  canNavigate = true;

  constructor(private refDataService: ReferenceDataService, private hearingService: VideoHearingsService,
    private fb: FormBuilder, protected router: Router,
    private datePipe: DatePipe, protected bookingService: BookingService,
    private errorService: ErrorService) {
    super(bookingService, router);
    this.attemptingCancellation = false;
    this.hasSaved = false;
  }
  ngOnInit() {
    super.ngOnInit();
    this.failedSubmission = false;
    this.checkForExistingRequest();
    this.retrieveCourts();
    this.initForm();
  }

  private checkForExistingRequest() {
    this.hearing = this.hearingService.getCurrentRequest();
  }

  private initForm() {
    let hearingDateParsed = null;
    let startTimeHour = null;
    let startTimeMinute = null;
    let durationHour = null;
    let durationMinute = null;
    let room = '';

    if (this.hearing && this.hearing.scheduled_date_time) {
      const date = new Date(this.hearing.scheduled_date_time);
      hearingDateParsed = this.datePipe.transform(date, 'yyyy-MM-dd');
      startTimeHour = (date.getHours() < 10 ? '0' : '') + date.getHours();
      startTimeMinute = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    }

    if (this.hearing && this.hearing.scheduled_duration) {
      const duration = new Date();
      duration.setHours(0, 0, 0, 0);
      duration.setMinutes(this.hearing.scheduled_duration);
      durationHour = (duration.getHours() < 10 ? '0' : '') + duration.getHours();
      durationMinute = (duration.getMinutes() < 10 ? '0' : '') + duration.getMinutes();
    }

    if (this.hearing && this.hearing.scheduled_date_time && this.hearing.scheduled_duration && this.hearing.court_id) {
      this.hasSaved = true;
    }

    if (this.hearing && this.hearing.court_room) {
      room = this.hearing.court_room;
    }

    this.schedulingForm = this.fb.group({
      hearingDate: [hearingDateParsed, Validators.required],
      hearingStartTimeHour: [startTimeHour, [Validators.required, Validators.min(0), Validators.max(23)]],
      hearingStartTimeMinute: [startTimeMinute, [Validators.required, Validators.min(0), Validators.max(59)]],
      hearingDurationHour: [durationHour, [Validators.required, Validators.min(0), Validators.max(23)]],
      hearingDurationMinute: [durationMinute, [Validators.required, Validators.min(0), Validators.max(59)]],
      courtAddress: [this.hearing.court_id, [Validators.required, Validators.min(1)]],
      courtRoom: [room],
    });
  }

  get hearingDate() { return this.schedulingForm.get('hearingDate'); }
  get hearingStartTimeHour() { return this.schedulingForm.get('hearingStartTimeHour'); }
  get hearingStartTimeMinute() { return this.schedulingForm.get('hearingStartTimeMinute'); }
  get hearingDurationHour() { return this.schedulingForm.get('hearingDurationHour'); }
  get hearingDurationMinute() { return this.schedulingForm.get('hearingDurationMinute'); }
  get courtAddress() { return this.schedulingForm.get('courtAddress'); }
  get courtRoom() { return this.schedulingForm.get('courtRoom'); }

  get hearingDateInvalid() {
    return this.hearingDate.invalid && (this.hearingDate.dirty || this.hearingDate.touched || this.failedSubmission);
  }

  get hearingStartTimeHourInvalid() {
    return this.hearingStartTimeHour.invalid &&
      (this.hearingStartTimeHour.dirty || this.hearingStartTimeHour.touched || this.failedSubmission);
  }

  get hearingStartTimeMinuteInvalid() {
    return this.hearingStartTimeMinute.invalid &&
      (this.hearingStartTimeMinute.dirty || this.hearingStartTimeMinute.touched || this.failedSubmission);
  }

  get hearingDurationHourInvalid() {
    return this.hearingDurationHour.invalid &&
      (this.hearingDurationHour.dirty || this.hearingDurationHour.touched || this.failedSubmission);
  }

  get hearingDurationMinuteInvalid() {
    return this.hearingDurationMinute.invalid &&
      (this.hearingDurationMinute.dirty || this.hearingDurationMinute.touched || this.failedSubmission);
  }

  get courtAddressInvalid() {
    return this.courtAddress.invalid && (this.courtAddress.dirty || this.courtAddress.touched || this.failedSubmission);
  }

  private retrieveCourts() {
    this.refDataService.getCourts()
      .subscribe(
        (data: CourtResponse[]) => {
          this.availableCourts = data;
          const pleaseSelect = new CourtResponse();
          pleaseSelect.address = 'Please Select';
          pleaseSelect.id = -1;
          this.availableCourts.unshift(pleaseSelect);
        },
        error => this.errorService.handleError(error)
      );
  }

  saveScheduleAndLocation() {
    if (this.schedulingForm.valid) {
      this.failedSubmission = false;
      this.updateHearingRequest();
      this.schedulingForm.markAsPristine();
      this.hasSaved = true;
      if (this.editMode) {
        this.navigateToSummary();
      } else {
        this.router.navigate(['/assign-judge']);
      }
    } else {
      this.failedSubmission = true;
    }
  }

  private updateHearingRequest() {
    this.hearing.court_id = this.schedulingForm.value.courtAddress;
    this.hearing.court_room = this.schedulingForm.value.courtRoom;
    const hearingDate = new Date(this.schedulingForm.value.hearingDate);

    hearingDate.setHours(
      this.schedulingForm.value.hearingStartTimeHour,
      this.schedulingForm.value.hearingStartTimeMinute
    );

    this.hearing.scheduled_date_time = hearingDate;
    let hearingDuration = (this.schedulingForm.value.hearingDurationHour * 60);
    hearingDuration += this.schedulingForm.value.hearingDurationMinute;
    this.hearing.scheduled_duration = hearingDuration;
    this.hearingService.updateHearingRequest(this.hearing);
  }

  continueBooking() {
    this.attemptingCancellation = false;
  }

  confirmCancelBooking() {
    if (this.editMode) {
      this.navigateToSummary();
    } else {
      this.attemptingCancellation = true;
    }
  }

  cancelBooking() {
    this.attemptingCancellation = false;
    this.hearingService.cancelRequest();
    this.schedulingForm.reset();
    this.router.navigate(['/dashboard']);
  }

  goToDiv(fragment: string): void {
    window.document.getElementById(fragment).parentElement.parentElement.scrollIntoView();
  }

  hasChanges(): Observable<boolean> | boolean {
    if (this.schedulingForm.dirty) {
      this.confirmCancelBooking();
    }
    return this.schedulingForm.dirty;
  }
}
